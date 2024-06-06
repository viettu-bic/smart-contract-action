// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TestERC721.sol";
import {IMarketplace} from "../marketplace/interfaces/IMarketplace.sol";

contract TestHandlesController {
    event CreateAuction(uint256 auctionId);

    IERC20 public bic;
    TestERC721 public collection;
    IMarketplace public marketplace;

    constructor(address _bic, address _collection, address _marketplace) {
        bic = IERC20(_bic);
        collection = TestERC721(_collection);
        marketplace = IMarketplace(_marketplace);
    }

    function createAuction() external {
        // mint
        uint256 tokenId = collection._nextTokenId();
        collection.safeMint();

        collection.approve(address(marketplace), tokenId);

        IMarketplace.AuctionParameters memory auctionParams;
        auctionParams.assetContract = address(collection);
        auctionParams.currency = address(bic);
        auctionParams.minimumBidAmount = 10e18;
        auctionParams.buyoutBidAmount = 1000e18;
        auctionParams.startTimestamp = uint64(block.timestamp);
        auctionParams.endTimestamp = uint64(
            block.timestamp + 15 minutes
        );
        auctionParams.timeBufferInSeconds = 1 minutes;
        auctionParams.bidBufferBps = 1000;

        auctionParams.tokenId = tokenId;

        auctionParams.quantity = 1;
        uint256 auctionId = marketplace.createAuction(auctionParams);
    }
}
