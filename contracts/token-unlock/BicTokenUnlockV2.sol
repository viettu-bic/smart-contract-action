pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract BicUnlockTokenV2 is Context {
    event ERC20Released(address indexed token, uint256 amount);

    uint256 private _released;
    uint256 private _erc20Released;
    uint256 private _totalAmount;
    address private immutable _erc20;
    address private immutable _beneficiary;
    uint64 private immutable _start;
    uint64 private immutable _end;
    uint64 private immutable _duration;
    uint64 private immutable _count;
    uint64 private _currentCount;


    /**
     * @dev Set the beneficiary, start timestamp and vesting duration of the vesting wallet.
     */
    constructor(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 startTimestamp, uint64 countNumber, uint64 durationSeconds) payable {
        require(beneficiaryAddress != address(0), "VestingWallet: beneficiary is zero address");
        require(totalAmount > 0, "VestingWallet: total amount invalid");
        require(erc20 != address(0), "VestingWallet: erc20 invalid");

        _beneficiary = beneficiaryAddress;
        _start = startTimestamp;
        _end = startTimestamp + durationSeconds* countNumber;
        _duration = durationSeconds;
        _erc20 = erc20;
        _totalAmount = totalAmount;
        _count = countNumber;
    }

    /**
     * @dev Getter for the beneficiary address.
     */
    function beneficiary() public view virtual returns (address) {
        return _beneficiary;
    }

    /**
     * @dev Getter for the start timestamp.
     */
    function start() public view virtual returns (uint256) {
        return _start;
    }

    /**
     * @dev Getter for the end timestamp.
     */
    function end() public view virtual returns (uint256) {
        return _end;
    }

    /**
     * @dev Getter for the vesting duration.
     */
    function duration() public view virtual returns (uint256) {
        return _duration;
    }

    /**
     * @dev Getter for the latest vesting
     */
    function lastAtCurrentCount() public view virtual returns (uint256) {
        return _start + (_duration * _currentCount);
    }

    /**
     * @dev Getter for the latest vesting
     */
    function count() public view virtual returns (uint256) {
        return _count;
    }

    /**
     * @dev Getter for current count
     */
    function currentCount() public view virtual returns (uint256) {
        return _currentCount;
    }

    /**
     * @dev Amount of token already released
     */
    function released() public view virtual returns (uint256) {
        return _erc20Released;
    }

    /**
     * @dev Getter for the amount of releasable `token` tokens. `token` should be the address of an
     * IERC20 contract.
     */
    function releasable() public view virtual returns (uint256, uint256) {
        return _vestingSchedule(uint64(block.timestamp));
    }

        /**
     * @dev Calculates the amount of tokens that has already vested. Default implementation is a linear vesting curve.
     */
    function releasable(uint64 timestamp) public view virtual returns (uint256, uint256) {
        return _vestingSchedule(timestamp);
    }

    /**
     * @dev Release the tokens that have already vested.
     *
     * Emits a {ERC20Released} event.
     */
    function release() public virtual {
        (uint256 amount, uint256 intervals) = releasable();
        require(amount > 0, "VestingWallet: no tokens to release");
        
        _erc20Released += amount;
        _currentCount+= uint64(intervals);
        emit ERC20Released(_erc20, amount);
        SafeERC20.safeTransfer(IERC20(_erc20), beneficiary(), amount);
    }



    /**
     * @dev Virtual implementation of the vesting formula. This returns the amount vested, as a function of time, for
     * an asset given its total historical allocation.
     */
    function _vestingSchedule(uint64 timestamp) internal view virtual returns (uint256, uint256) {
        if (timestamp < start()) {
            return (0, 0);
        } else if (timestamp > end()) {
            return (IERC20(_erc20).balanceOf(address(this)), _count - _currentCount); // Allow user vest all amount in contract
        } else {
            uint256 elapsedTime = uint256(timestamp) - lastAtCurrentCount();
            uint256 totalInterval = elapsedTime / duration();
            uint256 amountEachDuration = _totalAmount / _count;
            // TODO please check claimedIntervals = 0;
            uint256 amount = totalInterval * amountEachDuration;
            
            return (amount, totalInterval);
        }
    }
}
