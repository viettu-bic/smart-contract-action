# Solidity API

## IMarketplace

### NewBid

```solidity
event NewBid(uint256 auctionId, address bidder, address assetContract, uint256 bidAmount)
```

_Emitted when a new bid is made in an auction._

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

