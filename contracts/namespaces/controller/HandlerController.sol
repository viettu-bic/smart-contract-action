// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IBicPermissions} from "../../management/interfaces/IBicPermissions.sol";
import {IMarketplace} from "../../marketplace/interfaces/IMarketplace.sol";
import {HandlesErrors} from '../constants/HandlesErrors.sol';
import {IBaseHandles} from '../interfaces/IBaseHandles.sol';
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HandlerController is ReentrancyGuard {
    address public verifier;
    // Rent in base price units by length
    uint256[] public prices;
    uint256 public priceLength;
    IERC20 public bic;
    IBicPermissions public immutable _bicPermissions;
    mapping(bytes32 => uint256) public commitments;

    constructor(IBicPermissions _bp, IERC20 _bic) {
        _bicPermissions = _bp;
        bic = _bic;
    }

    modifier onlyOperator() {
        if (!_bicPermissions.hasRole(_bicPermissions.OPERATOR_ROLE(), msg.sender)) {
            revert HandlesErrors.NotOperator();
        }
        _;
    }

    function setVerifier(address _verifier) external onlyOperator {
        verifier = _verifier;
    }

    function requestHandler(address receiver, address handler, string calldata name, address[] calldata beneficiaries, uint256 commitDuration, bool isAuction, bytes calldata signature) external nonReentrant {
        bytes32 dataHash = ECDSA.toEthSignedMessageHash(getRequestHandlerOp(receiver, handler, name, beneficiaries, commitDuration, isAuction));
        address signer = ECDSA.recover(dataHash, signature);
        require(signer == verifier, "HandlerController: invalid signature");
        if(commitDuration == 0) { // directly mint from handler
            _mintHandle(handler, receiver, name);
        } else { // auction or commit
            if(isAuction) {
                // auction
            } else {
                // commit
                bool isCommit = _isCommit(dataHash, commitDuration);
                if(isCommit) {
                    _mintHandle(handler, receiver, name);
                } else {
                    // TODO emit event commit
                }
            }
        }
    }

    function _isCommit(bytes32 commitment, uint256 commitDuration) private returns(bool) {
        if(commitments[commitment] != 0) {
            if(commitments[commitment] < block.timestamp) {
                return false;
            }
        } else {
            commitments[commitment] = block.timestamp + commitDuration ;
        }
        return true;
    }

    function _mintHandle(address handler, address to, string calldata name) private {
        uint256 basePrice = price(name);
        IERC20(bic).transferFrom(msg.sender, address(this), basePrice);
        IBaseHandles(handler).mintHandle(to, name);
        // TODO emit event
    }

    function setPrices(uint256[] calldata _prices) external onlyOperator {
        prices = _prices;
        priceLength = _prices.length;
    }

    function withdraw(address token, address to, uint256 amount) external onlyOperator {
        if(token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).transfer(to, amount);
        }
    }

    function price(
        string calldata name
    ) external view override returns (uint256 basePrice) {
        uint256 len = name.strlen();
        if (len >= priceLength) {
            basePrice = prices[priceLength - 1];
        } else {
            basePrice = prices[len - 1];
        }

    }

    function getRequestHandlerOp(address receiver, address handler, string calldata name, address[] calldata beneficiaries, uint256 commitDuration, bool isAuction) public view returns (bytes32) {
        return keccak256(abi.encode(handler, name, beneficiaries, commitDuration, block.chainid));
    }
}
