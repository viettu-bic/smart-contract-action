// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// Library
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Internal
import {BicPermissions} from "../management/BicPermissions.sol";
import {IBicTokenUnlock} from "./interfaces/IBicTokenUnlock.sol";

contract BicTokenUnlock is IBicTokenUnlock, ReentrancyGuard {
    // constant
    uint256 public constant UNLOCK_RATE_MIN = 50; // 0.5% * 100
    uint256 public constant UNLOCK_RATE_MAX = 300; // 3% * 100

    // Library
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Immutable
    BicPermissions public immutable permissions;
    address public immutable bicToken;

    // Variable
    /**
     * @notice Storage for keeping root data and it's cycle
     */
    struct MerkleData {
        uint256 cycle;
        bytes32 root;
    }
    MerkleData private merkleData;

    /**
     * @notice Storage user data about total claim and unlock rate
     */
    struct UserData {
        uint256 claimedAmount;
        uint256 unlockRate;
        bool isConfirmed;
    }
    mapping(address => UserData) public usersData;

    /**
     * @notice Storage keep track claim states
     */
    mapping(bytes32 => bool) claimedLeafs;

    /**
     * @notice event notify root has been updated
     * @param cycle increase number for new root proposed
     * @param root data based on latest user unlock action
     */
    event RootUpdated(uint256 indexed cycle, bytes32 root);

    /**
     * @notice Event to notify for our listener to sync the claim status
     */
    event Claimed(
        uint256 indexed cycle,
        address indexed user,
        string claimId,
        uint256 claimTimestamp,
        uint256 claimAmount
    );

    /**
     * @notice Event to notify for our listener to sync user's unlock rate
     */
    event UnlockRate(address indexed user, uint256 unlockRate);

    // Modifier
    function _onlyOperator() internal view {
        require(
            permissions.hasRole(permissions.OPERATOR_ROLE(), msg.sender),
            "only operator"
        );
    }

    modifier onlyOperator() {
        _onlyOperator();
        _;
    }

    /**
     * @param _permissions management
     * @param _bicToken BIC token on arbitrum
     */
    constructor(BicPermissions _permissions, address _bicToken) {
        permissions = _permissions;
        bicToken = _bicToken;
    }

    /**
     * @notice onlyOperator can perform this propose
     * @param cycle number will increase sequentially by 1
     * @param root latest generated mekle tree root
     */
    function proposeRoot(uint256 cycle, bytes32 root) external onlyOperator {
        require(cycle == merkleData.cycle.add(1), "incorrect cycle");

        merkleData.cycle = cycle;
        merkleData.root = root;

        emit RootUpdated(cycle, root);
    }

    /**
     * @notice @TODO, right now onlyOperator can submit this tx, or sign signature before confirm
     * @param unlockRate to token unlock
     */
    function confirmUnlockRate(
        address user,
        uint256 unlockRate
    ) external onlyOperator {
        UserData storage userData = usersData[user];

        require(
            !userData.isConfirmed,
            "The unlock rate has already been confirmed"
        );
        require(
            unlockRate >= UNLOCK_RATE_MIN && unlockRate <= UNLOCK_RATE_MAX,
            "The unlock rate is over limited"
        );

        userData.isConfirmed = true;
        userData.unlockRate = unlockRate;

        emit UnlockRate(user, unlockRate);
    }

    /**
     * @notice is function to check the validation of claim data
     */
    function isValidClaim(
        uint256 cycle,
        address user,
        string[] calldata claimIds,
        uint256[] calldata claimTimestamps,
        uint256[] calldata claimAmounts,
        bytes32[] calldata merkleProof
    ) public view override returns (bool) {
        if (cycle != merkleData.cycle) return false;
        if (claimIds.length != claimTimestamps.length) return false;
        if (claimIds.length != claimAmounts.length) return false;

        bytes32 leaf = keccak256(
            bytes.concat(
                keccak256(
                    abi.encode(
                        cycle,
                        user,
                        claimIds,
                        claimTimestamps,
                        claimAmounts
                    )
                )
            )
        );
        return MerkleProof.verify(merkleProof, merkleData.root, leaf);
    }

    /**
     * @notice claim from week 1 to latest week
     */
    function claim(
        uint256 cycle,
        address user,
        string[] calldata claimIds,
        uint256[] calldata claimTimestamps,
        uint256[] calldata claimAmounts,
        bytes32[] calldata merkleProof
    ) external override nonReentrant {
        // Verify proof first
        require(
            isValidClaim(
                cycle,
                user,
                claimIds,
                claimTimestamps,
                claimAmounts,
                merkleProof
            ),
            "Invalid claim data"
        );

        // Verify unlock rate
        UserData storage userData = usersData[user];
        require(
            userData.isConfirmed,
            "The unlock rate has not been confirmed yet"
        );

        for (uint256 i = 0; i < claimIds.length; i++) {
            bytes32 claimleaf = keccak256(
                bytes.concat(
                    keccak256(
                        abi.encode(
                            user,
                            claimIds[i],
                            claimTimestamps[i],
                            claimAmounts[i]
                        )
                    )
                )
            );

            // If user already claim so just so continute to next entry
            if (claimedLeafs[claimleaf] == true) continue;

            // If claim time not comming yet so continute to next entry
            if (claimTimestamps[i] > block.timestamp) continue;

            // Check valid of claiming
            require(!claimedLeafs[claimleaf], "Already claimed");
            require(
                claimTimestamps[i] <= block.timestamp,
                "The claim has not been come yet"
            );

            // Everything ok, then update status to mapping
            claimedLeafs[claimleaf] = true;

            // Update amount
            userData.claimedAmount += claimAmounts[i];

            // Send token to user address
            IERC20(bicToken).safeTransfer(user, claimAmounts[i]);

            // Emit event
            emit Claimed(
                0,
                user,
                claimIds[i],
                claimTimestamps[i],
                claimAmounts[i]
            );
        }
    }

    /**
     * @notice get total claimedAmount
     */
    function getClaimedAmount(
        address user
    ) public view override returns (uint256) {
        UserData memory userData = usersData[user];
        return userData.claimedAmount;
    }

    /**
     * Get merke data
     */
    function getMerkleData() external view returns (MerkleData memory) {
        return merkleData;
    }
}
