// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IMarketplace} from "../marketplace/interfaces/IMarketplace.sol";
import "hardhat/console.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC2771Context} from "./ERC2771Context.sol";

contract TestMarketplace is IMarketplace, ERC2771Context {
    struct MockAuction {
        address assetContract;
        uint256 tokenId;
        address seller;
        address highestBidder;
        uint256 bidAmount;
    }

    IERC20 public bic;
    uint256 public auctionId;

    mapping(uint256 => MockAuction) public auctions;

    constructor(
        IERC20 _bic,
        address[] memory trustedForwarders
    ) ERC2771Context(trustedForwarders) {
        bic = _bic; 
    }

    function createAuction(
        IMarketplace.AuctionParameters memory _auctionParams
    ) external returns (uint256 id) {
        IERC721(_auctionParams.assetContract).transferFrom(
            _msgSender(),
            address(this),
            _auctionParams.tokenId
        );
        auctions[auctionId] = MockAuction(
            _auctionParams.assetContract,
            _auctionParams.tokenId,
            _msgSender(),
            _msgSender(),
            0
        );
        id = auctionId;
        return auctionId += 1;
    }

    function bidInAuction(uint256 _auctionId, uint256 _bidAmount) external {
        require(
            _bidAmount > 0,
            "Marketplace: Bid amount must be greater than 0"
        );
        address sender =  _msgSender();

        bic.transferFrom(sender, address(this), _bidAmount);

        MockAuction storage auction = auctions[_auctionId];
        auction.highestBidder = sender;
        auction.bidAmount = _bidAmount;
        auctions[_auctionId] = auction;
    }

    //    function collectAuctionPayout(uint256 _auctionId) external {
    //    }

    function collectAuctionTokens(uint256 _auctionId) external {
        MockAuction memory auction = auctions[_auctionId];
        IERC721(auction.assetContract).transferFrom(
            address(this),
            auction.highestBidder,
            auction.tokenId
        );
    }
}
