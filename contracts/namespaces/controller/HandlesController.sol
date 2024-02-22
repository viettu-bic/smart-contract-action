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
    IMarketplace public marketplace;
    uint256 public collectsDenominator = 10000;
    address public collector;

    event MintHandle(address indexed handle, address indexed to, string name);
    event Commitment(bytes32 indexed commitment, uint256 endTimestamp);
    event SetVerifier(address indexed verifier);
    event SetPrices(uint256[] prices);
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

    function requestHandles(address receiver, address handle, string calldata name, address[] calldata beneficiaries, uint256[] calldata collects, uint256 commitDuration, bool isAuction, bytes calldata signature) external nonReentrant {
        bytes32 dataHash = getRequestHandlesOp(receiver, handle, name, beneficiaries, collects, commitDuration, isAuction);
        require(_verifySignature(dataHash, signature), "HandlesController: invalid signature");

        if(commitDuration == 0) { // directly mint from handle
            _mintHandle(handle, receiver, name, beneficiaries, collects);
        } else { // auction or commit
            if(isAuction) {
                // auction
                _mintHandle(handle, address(this), name, beneficiaries, collects);
                IBaseHandles(handle).approve(address(marketplace), IBaseHandles(handle).getTokenId(name));

                IMarketplace.AuctionParameters memory auctionParams;
                auctionParams.assetContract = handle;
                auctionParams.currency = address(bic);
                auctionParams.minimumBidAmount = getPrice(name);
                auctionParams.buyoutBidAmount = 0;
                auctionParams.startTimestamp = uint64(block.timestamp);
                auctionParams.endTimestamp = uint64(block.timestamp + commitDuration);
                auctionParams.timeBufferInSeconds = 900;
                auctionParams.bidBufferBps = 500;
                auctionParams.tokenId = IBaseHandles(handle).getTokenId(name);
                auctionParams.quantity = 1;
                uint256 auctionId = marketplace.createAuction(auctionParams);
                emit CreateAuction(auctionId);
            } else {
                // commit
                bool isCommitted = _isCommitted(dataHash, commitDuration);
                if(!isCommitted) {
                    _mintHandle(handle, receiver, name, beneficiaries, collects);
                }
            }
        }
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

    function _mintHandle(address handle, address to, string calldata name, address[] calldata beneficiaries, uint256[] calldata collects) private {
        uint256 basePrice = getPrice(name);
        if(to != address(this)) {
            IERC20(bic).transferFrom(msg.sender, address(this), basePrice);
            uint256 totalCollects = 0;
            for(uint256 i = 0; i < beneficiaries.length; i++) {
                uint256 collect = basePrice * collects[i] / collectsDenominator;
                IERC20(bic).transferFrom(msg.sender, beneficiaries[i], collect);
                totalCollects += collect;
            }
            if(totalCollects < basePrice) {
                IERC20(bic).transferFrom(msg.sender, collector, basePrice - totalCollects);
            }
        }
        IBaseHandles(handle).mintHandle(to, name);
        emit MintHandle(handle, to, name);
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

    function getRequestHandlesOp(address receiver, address handle, string calldata name, address[] calldata beneficiaries, uint256[] calldata collects, uint256 commitDuration, bool isAuction) public view returns (bytes32) {
        require(beneficiaries.length == collects.length, "HandlesController: invalid beneficiaries and collects");
        uint256 totalCollects = 0;
        for(uint256 i = 0; i < collects.length; i++) {
            totalCollects += collects[i];
        }
        require(totalCollects <= collectsDenominator, "HandlesController: invalid collects");
        require((isAuction && commitDuration > 0) || (!isAuction && commitDuration == 0), "HandlesController: invalid isAuction and commitDuration");
        return keccak256(abi.encode(receiver, handle, name, beneficiaries, collects, commitDuration, isAuction, block.chainid));
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
