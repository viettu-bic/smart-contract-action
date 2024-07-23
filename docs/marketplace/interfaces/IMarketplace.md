# Solidity API

## IMarketplace

_It using to interactive ThirdWeb marketplace v3:
https://github.com/thirdweb-dev/contracts/blob/main/contracts/prebuilts/marketplace-legacy/Marketplace.sol_

### AuctionParameters

```solidity
struct AuctionParameters {
  address assetContract;
  uint256 tokenId;
  uint256 quantity;
  address currency;
  uint256 minimumBidAmount;
  uint256 buyoutBidAmount;
  uint64 timeBufferInSeconds;
  uint64 bidBufferBps;
  uint64 startTimestamp;
  uint64 endTimestamp;
}
```

### createAuction

```solidity
function createAuction(struct IMarketplace.AuctionParameters _params) external returns (uint256 auctionId)
```

### bidInAuction

```solidity
function bidInAuction(uint256 _auctionId, uint256 _bidAmount) external payable
```

### Status

```solidity
enum Status {
  UNSET,
  CREATED,
  COMPLETED,
  CANCELLED
}
```

### TokenType

```solidity
enum TokenType {
  ERC721,
  ERC1155
}
```

### Auction

```solidity
struct Auction {
  uint256 auctionId;
  uint256 tokenId;
  uint256 quantity;
  uint256 minimumBidAmount;
  uint256 buyoutBidAmount;
  uint64 timeBufferInSeconds;
  uint64 bidBufferBps;
  uint64 startTimestamp;
  uint64 endTimestamp;
  address auctionCreator;
  address assetContract;
  address currency;
  enum IMarketplace.TokenType tokenType;
  enum IMarketplace.Status status;
}
```

