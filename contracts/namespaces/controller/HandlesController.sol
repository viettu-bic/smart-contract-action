// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IBicPermissions} from "../../management/interfaces/IBicPermissions.sol";
import {IMarketplace} from "../../marketplace/interfaces/IMarketplace.sol";
import {IHandles} from '../interfaces/IHandles.sol';
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HandlesController is ReentrancyGuard {
    struct AuctionRequest {
        bool canClaim;
        address[] beneficiaries;
        uint256[] collects;
    }

    struct HandleRequest {
        address receiver;
        address handle;
        string name;
        uint256 price;
        address[] beneficiaries;
        uint256[] collects;
        uint256 commitDuration;
        bool isAuction;
    }

    address public verifier;
    IERC20 public bic;
    IBicPermissions public immutable _bicPermissions;
    mapping(bytes32 => uint256) public commitments;
    IMarketplace public marketplace;
    uint256 public collectsDenominator = 10000;
    address public collector;

    mapping(string => AuctionRequest) public nameToAuctionRequest;

    event MintHandle(address indexed handle, address indexed to, string name);
    event Commitment(bytes32 indexed commitment, uint256 endTimestamp);
    event SetVerifier(address indexed verifier);
    event SetMarketplace(address indexed marketplace);
    event CreateAuction(uint256 auctionId);

    constructor(IBicPermissions _bp, IERC20 _bic) {
        _bicPermissions = _bp;
        bic = _bic;
    }

    modifier onlyOperator() {
        require(_bicPermissions.hasRole(_bicPermissions.OPERATOR_ROLE(), msg.sender), "HandlesController: caller is not an operator");
        _;
    }

    function setVerifier(address _verifier) external onlyOperator {
        verifier = _verifier;
        emit SetVerifier(_verifier);
    }

    function setMarketplace(address _marketplace) external onlyOperator {
        marketplace = IMarketplace(_marketplace);
        emit SetMarketplace(_marketplace);
    }

    function updateCollectsDenominator(uint256 _collectsDenominator) external onlyOperator {
        collectsDenominator = _collectsDenominator;
    }

    function setCollector(address _collector) external onlyOperator {
        collector = _collector;
    }

    function requestHandle(HandleRequest calldata rq, uint256 validUntil, uint256 validAfter, bytes calldata signature) external nonReentrant {
        bytes32 dataHash = getRequestHandleOp(rq, validUntil, validAfter);
        require(_verifySignature(dataHash, signature), "HandlesController: invalid signature");

        if(rq.commitDuration == 0) { // directly mint from handle
            _mintHandle(rq.handle, rq.receiver, rq.name, rq.price, rq.beneficiaries, rq.collects);
        } else { // auction or commit
            if(rq.isAuction) {
                // auction
                _mintHandle(rq.handle, address(this),  rq.name, rq.price, rq.beneficiaries, rq.collects);
                IHandles(rq.handle).approve(address(marketplace), IHandles(rq.handle).getTokenId(rq.name));

                IMarketplace.AuctionParameters memory auctionParams;
                auctionParams.assetContract = rq.handle;
                auctionParams.currency = address(bic);
                auctionParams.minimumBidAmount = rq.price;
                auctionParams.buyoutBidAmount = 0;
                auctionParams.startTimestamp = uint64(block.timestamp);
                auctionParams.endTimestamp = uint64(block.timestamp + rq.commitDuration);
                auctionParams.timeBufferInSeconds = 900;
                auctionParams.bidBufferBps = 500;
                auctionParams.tokenId = IHandles(rq.handle).getTokenId(rq.name);
                auctionParams.quantity = 1;
                uint256 auctionId = marketplace.createAuction(auctionParams);
                nameToAuctionRequest[rq.name] = AuctionRequest(true, rq.beneficiaries, rq.collects);
                emit CreateAuction(auctionId);
            } else {
                // commit
                bool isCommitted = _isCommitted(dataHash, rq.commitDuration);
                if(!isCommitted) {
                    _mintHandle(rq.handle, rq.receiver, rq.name, rq.price, rq.beneficiaries, rq.collects);
                }
            }
        }
    }

    function collectAuctionPayout(string calldata name, uint256 amount, bytes calldata signature) external nonReentrant {
        require(nameToAuctionRequest[name].canClaim, "HandlesController: not an auction");
        bytes32 dataHash = getCollectAuctionPayoutOp(name, amount);
        require(_verifySignature(dataHash, signature), "HandlesController: invalid signature");
        _payout(amount, nameToAuctionRequest[name].beneficiaries, nameToAuctionRequest[name].collects);
        nameToAuctionRequest[name].canClaim = false;
    }

    function _verifySignature(bytes32 dataHash, bytes calldata signature) private view returns(bool) {
        bytes32 dataHashSign = ECDSA.toEthSignedMessageHash(dataHash);
        address signer = ECDSA.recover(dataHashSign, signature);
        return signer == verifier;
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

    function _mintHandle(address handle, address to, string calldata name, uint256 price, address[] calldata beneficiaries, uint256[] calldata collects) private {
        if(to != address(this)) {
            IERC20(bic).transferFrom(msg.sender, address(this), price);
            _payout(price, beneficiaries, collects);
        }
        IHandles(handle).mintHandle(to, name);
        emit MintHandle(handle, to, name);
    }

    function _payout(uint256 amount, address[] memory beneficiaries, uint256[] memory collects) private {
        uint256 totalCollects = 0;
        for(uint256 i = 0; i < beneficiaries.length; i++) {
            uint256 collect = amount * collects[i] / collectsDenominator;
            IERC20(bic).transfer(beneficiaries[i], collect);
            totalCollects += collect;
        }
        if(totalCollects < amount) {
            IERC20(bic).transfer(collector, amount - totalCollects);
        }
    }

    function withdraw(address token, address to, uint256 amount) external onlyOperator {
        if(token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).transfer(to, amount);
        }
    }

    function getRequestHandleOp(HandleRequest calldata rq, uint256 validUntil, uint256 validAfter) public view returns (bytes32) {
        {
            require(block.timestamp <= validUntil, "HandlesController: invalid validUntil");
            require(block.timestamp > validAfter, "HandlesController: invalid validAfter");
            require(rq.beneficiaries.length == rq.collects.length, "HandlesController: invalid beneficiaries and collects");
            uint256 totalCollects = 0;
            for(uint256 i = 0; i < rq.collects.length; i++) {
                totalCollects += rq.collects[i];
            }
            require(totalCollects <= collectsDenominator, "HandlesController: invalid collects");
            require((rq.isAuction && rq.commitDuration > 0) || !rq.isAuction, "HandlesController: invalid isAuction and commitDuration");
        }
        if (rq.commitDuration > 0 && !rq.isAuction) {
            return keccak256(
            abi.encode(
                rq.receiver,
                rq.handle,
                rq.name,
                rq.price,
                rq.beneficiaries,
                rq.collects,
                rq.commitDuration,
                rq.isAuction,
                block.chainid
                )
            );
        }
        return keccak256(
            abi.encode(
                rq.receiver,
                rq.handle,
                rq.name,
                rq.price,
                rq.beneficiaries,
                rq.collects,
                block.chainid,
                validUntil,
                validAfter
            )
        );
    }

    function getCollectAuctionPayoutOp(string calldata name, uint256 amount) public view returns (bytes32) {
        return keccak256(abi.encode(name, amount, block.chainid));
    }
}
