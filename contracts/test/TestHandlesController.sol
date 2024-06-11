// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TestERC721.sol";
import {IMarketplace} from "../marketplace/interfaces/IMarketplace.sol";
import {IBicForwarder} from "../forwarder/BicForwarder.sol";



contract TestHandlesController {
    event CreateAuction(uint256 auctionId);

    IERC20 public bic;
    TestERC721 public collection;
    IMarketplace public marketplace;
    IBicForwarder public forwarder;

    constructor(address _bic, address _collection, address _marketplace, address _forwarder) {
        bic = IERC20(_bic);
        collection = TestERC721(_collection);
        marketplace = IMarketplace(_marketplace);
        forwarder = IBicForwarder(_forwarder);
    }

    function createAuction(uint256 _startPrice) external {
        // mint
        uint256 tokenId = collection._nextTokenId();
        collection.mint();

        collection.approve(address(marketplace), tokenId);

        uint256 startPrice = _startPrice;

        IMarketplace.AuctionParameters memory auctionParams;
        auctionParams.assetContract = address(collection);
        auctionParams.currency = address(bic);
        auctionParams.minimumBidAmount = startPrice;
        auctionParams.buyoutBidAmount = 10000e18;
        auctionParams.startTimestamp = uint64(block.timestamp);
        auctionParams.endTimestamp = uint64(
            block.timestamp + 15 minutes
        );
        auctionParams.timeBufferInSeconds = 1 minutes;
        auctionParams.bidBufferBps = 1000;

        auctionParams.tokenId = tokenId;

        auctionParams.quantity = 1;
        uint256 auctionId = marketplace.createAuction(auctionParams);

        emit CreateAuction(auctionId);
        IBicForwarder.RequestData memory requestData;
        requestData.from = msg.sender;
        requestData.to = address(marketplace);
        requestData.data = abi.encodeWithSelector(
            IMarketplace.bidInAuction.selector,
            auctionId,
            startPrice
        );
        requestData.value = 0;
        
        forwarder.forwardRequest(requestData);
    }
}
