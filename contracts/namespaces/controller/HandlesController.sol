// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IBicPermissions} from "../../management/interfaces/IBicPermissions.sol";
import {IMarketplace} from "../../marketplace/interfaces/IMarketplace.sol";
import {IBaseHandles} from '../interfaces/IBaseHandles.sol';
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HandlesController is ReentrancyGuard {
    address public verifier;
    // Rent in base price units by length
    uint256[] public prices;
    uint256 public priceLength;
    IERC20 public bic;
    IBicPermissions public immutable _bicPermissions;
    mapping(bytes32 => uint256) public commitments;

    event MintHandle(address indexed handler, address indexed to, string name);
    event Commitment(bytes32 indexed commitment, uint256 endTimestamp);
    event SetVerifier(address indexed verifier);
    event SetPrices(uint256[] prices);

    constructor(IBicPermissions _bp, IERC20 _bic) {
        _bicPermissions = _bp;
        bic = _bic;
    }

    modifier onlyOperator() {
        require(_bicPermissions.hasRole(_bicPermissions.OPERATOR_ROLE(), msg.sender), "HandlerController: caller is not an operator");
        _;
    }

    function setVerifier(address _verifier) external onlyOperator {
        verifier = _verifier;
        emit SetVerifier(_verifier);
    }

    function requestHandler(address receiver, address handler, string calldata name, address[] calldata beneficiaries, uint256 commitDuration, bool isAuction, bytes calldata signature) external nonReentrant {
        bytes32 dataHash = getRequestHandlerOp(receiver, handler, name, beneficiaries, commitDuration, isAuction);
        bytes32 dataHashSign = ECDSA.toEthSignedMessageHash(dataHash);
        address signer = ECDSA.recover(dataHashSign, signature);
        require(signer == verifier, "HandlerController: invalid signature");
        if(commitDuration == 0) { // directly mint from handler
            _mintHandle(handler, receiver, name);
        } else { // auction or commit
            if(isAuction) {
                // auction
            } else {
                // commit
                bool isCommitted = _isCommitted(dataHash, commitDuration);
                if(!isCommitted) {
                    _mintHandle(handler, receiver, name);
                }
            }
        }
    }

    function _isCommitted(bytes32 commitment, uint256 commitDuration) private returns(bool) {
        if(commitments[commitment] != 0) {
            if(commitments[commitment] < block.timestamp) {
                return false;
            }
        } else {
            commitments[commitment] = block.timestamp + commitDuration ;
            emit Commitment(commitment, block.timestamp + commitDuration);
        }
        return true;
    }

    function _mintHandle(address handler, address to, string calldata name) private {
        uint256 basePrice = getPrice(name);
        IERC20(bic).transferFrom(msg.sender, address(this), basePrice);
        IBaseHandles(handler).mintHandle(to, name);
        emit MintHandle(handler, to, name);
    }

    function setPrices(uint256[] calldata _prices) external onlyOperator {
        prices = _prices;
        priceLength = _prices.length;
        emit SetPrices(_prices);
    }

    function withdraw(address token, address to, uint256 amount) external onlyOperator {
        if(token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).transfer(to, amount);
        }
    }

    function getPrice(
        string calldata name
    ) public view returns (uint256 basePrice) {
        uint256 len = strlen(name);
        if (len >= priceLength) {
            basePrice = prices[priceLength - 1];
        } else {
            basePrice = prices[len - 1];
        }
    }

    function getRequestHandlerOp(address receiver, address handler, string calldata name, address[] calldata beneficiaries, uint256 commitDuration, bool isAuction) public view returns (bytes32) {
        return keccak256(abi.encode(receiver, handler, name, beneficiaries, commitDuration, isAuction, block.chainid));
    }

    function strlen(string memory s) internal pure returns (uint256) {
        uint256 len;
        uint256 i = 0;
        uint256 bytelength = bytes(s).length;
        for (len = 0; i < bytelength; len++) {
            bytes1 b = bytes(s)[i];
            if (b < 0x80) {
                i += 1;
            } else if (b < 0xE0) {
                i += 2;
            } else if (b < 0xF0) {
                i += 3;
            } else if (b < 0xF8) {
                i += 4;
            } else if (b < 0xFC) {
                i += 5;
            } else {
                i += 6;
            }
        }
        return len;
    }
}
