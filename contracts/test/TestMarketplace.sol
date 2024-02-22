// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IMarketplace} from "../marketplace/interfaces/IMarketplace.sol";
import "hardhat/console.sol";
contract TestMarketplace {
    uint256 public auctionId;

    function createAuction(IMarketplace.AuctionParameters memory _auctionParams) external returns (uint256 auctionId) {
        auctionId = auctionId + 1;
        return auctionId;
    }

    function bidInAuction(uint256 _auctionId, uint256 _bidAmount) external {
        require(_bidAmount > 0, "Marketplace: Bid amount must be greater than 0");
    }

    function collectAuctionPayout(uint256 _auctionId) external {
    }

    function collectAuctionTokens(uint256 _auctionId) external {
    }
}
