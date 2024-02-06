// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "../marketplace/interfaces/IMarketplace.sol";

contract TestMarketplace is IMarketplace {
    uint256 public currentAuctionId = 0;

    function createAuction(AuctionParameters calldata /* _params */) external override returns (uint256 auctionId) {
        return currentAuctionId++;
    }
}
