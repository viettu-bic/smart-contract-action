// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IMarketplace} from "../marketplace/interfaces/IMarketplace.sol";
import "hardhat/console.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
contract TestMarketplace is IMarketplace {

    struct MockAuction {
        address assetContract;
        uint256 tokenId;
        address seller;
        address highestBidder;
    }

    uint256 public auctionId;

    mapping(uint256 => MockAuction) public auctions;

    function createAuction(IMarketplace.AuctionParameters memory _auctionParams) external returns (uint256 id) {
        IERC721(_auctionParams.assetContract).transferFrom(msg.sender, address(this), _auctionParams.tokenId);
        auctions[auctionId] = MockAuction(_auctionParams.assetContract, _auctionParams.tokenId, msg.sender, msg.sender);
        id = auctionId;
        return auctionId += 1;
    }

    function bidInAuction(uint256 _auctionId, uint256 _bidAmount) external {
        require(_bidAmount > 0, "Marketplace: Bid amount must be greater than 0");
        MockAuction storage auction = auctions[_auctionId];
        auction.highestBidder = msg.sender;
        auctions[_auctionId] = auction;
}

//    function collectAuctionPayout(uint256 _auctionId) external {
//    }

    function collectAuctionTokens(uint256 _auctionId) external {
        MockAuction memory auction = auctions[_auctionId];
        IERC721(auction.assetContract).transferFrom(address(this), auction.highestBidder, auction.tokenId);
    }
}
