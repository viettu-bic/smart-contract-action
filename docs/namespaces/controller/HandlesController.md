# Solidity API

## HandlesController

_Manages operations related to handle auctions and direct handle requests, including minting and claim payouts.
Uses ECDSA for signature verification and integrates with a marketplace for auction functionalities._

### AuctionConfig

Represents the configuration of an auction marketplace, including the buyout bid amount, time buffer, and bid buffer.

_Represents the configuration of an auction marketplace, including the buyout bid amount, time buffer, and bid buffer._

```solidity
struct AuctionConfig {
  uint256 buyoutBidAmount;
  uint64 timeBufferInSeconds;
  uint64 bidBufferBps;
}
```

### HandleRequest

_Represents a request to create a handle, either through direct sale or auction._

```solidity
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
```

### verifier

```solidity
address verifier
```

_The address of the verifier authorized to validate signatures._

### bic

```solidity
contract IERC20 bic
```

_The BIC token contract address._

### commitments

```solidity
mapping(bytes32 => uint256) commitments
```

_Mapping of commitments to their respective expiration timestamps. Used to manage the timing of commitments and auctions._

### marketplace

```solidity
contract IMarketplace marketplace
```

_The marketplace contract used for handling auctions._

### forwarder

```solidity
contract IBicForwarder forwarder
```

_The forwarder contract used for handling interactions with the BIC token._

### collectsDenominator

```solidity
uint256 collectsDenominator
```

_The denominator used for calculating beneficiary shares._

### collector

```solidity
address collector
```

_The address of the collector, who receives any residual funds not distributed to beneficiaries._

### auctionConfig

```solidity
struct HandlesController.AuctionConfig auctionConfig
```

_The configuration of the auction marketplace._

### auctionCanClaim

```solidity
mapping(uint256 => bool) auctionCanClaim
```

_Mapping of auctionId to status isClaimed._

### MintHandle

```solidity
event MintHandle(address handle, address to, string name, uint256 price)
```

_Emitted when a handle is minted, providing details of the transaction including the handle address, recipient, name, and price._

### Commitment

```solidity
event Commitment(bytes32 commitment, address from, address collection, string name, uint256 tokenId, uint256 price, uint256 endTimestamp, bool isClaimed)
```

_Emitted when a commitment is made, providing details of the commitment and its expiration timestamp._

### ShareRevenue

```solidity
event ShareRevenue(address from, address to, uint256 amount)
```

_Emitted when a handle is minted, providing details of the transaction including the handle address, recipient, name, and price._

### SetVerifier

```solidity
event SetVerifier(address verifier)
```

_Emitted when the verifier address is updated._

### SetForwarder

```solidity
event SetForwarder(address forwarder)
```

_Emitted when the forwarder address is updated._

### SetMarketplace

```solidity
event SetMarketplace(address marketplace)
```

_Emitted when the marketplace address is updated._

### SetAuctionMarketplace

```solidity
event SetAuctionMarketplace(struct HandlesController.AuctionConfig _newConfig)
```

_Emmitted when the auction marketplace configuration is updated._

### CreateAuction

```solidity
event CreateAuction(uint256 auctionId)
```

_Emitted when an auction is created, providing details of the auction ID._

### BurnHandleMintedButAuctionFailed

```solidity
event BurnHandleMintedButAuctionFailed(address handle, string name, uint256 tokenId)
```

_Emitted when a handle is minted but the auction fails due none bid._

### constructor

```solidity
constructor(contract IERC20 _bic) public
```

Initializes the HandlesController contract with the given BIC token address.

### setVerifier

```solidity
function setVerifier(address _verifier) external
```

Sets a new verifier address authorized to validate signatures.

_Can only be set by an operator. Emits a SetVerifier event upon success._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _verifier | address | The new verifier address. |

### setMarketplace

```solidity
function setMarketplace(address _marketplace) external
```

Sets the marketplace contract address used for handling auctions.

_Can only be set by an operator. Emits a SetMarketplace event upon success._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _marketplace | address | The address of the Thirdweb Marketplace contract. |

### setAuctionMarketplaceConfig

```solidity
function setAuctionMarketplaceConfig(struct HandlesController.AuctionConfig _newConfig) external
```

Sets the configuration of the auction marketplace.

_Can only be set by an operator. Emits a SetMarketplace event upon success._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newConfig | struct HandlesController.AuctionConfig | configuration of the auction marketplace |

### updateCollectsDenominator

```solidity
function updateCollectsDenominator(uint256 _collectsDenominator) external
```

Updates the denominator used for calculating beneficiary shares.

_Can only be performed by an operator. This is used to adjust the precision of distributions._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _collectsDenominator | uint256 | The new denominator value for share calculations. |

### setCollector

```solidity
function setCollector(address _collector) external
```

Sets the address of the collector, who receives any residual funds not distributed to beneficiaries.

_Can only be performed by an operator. This address acts as a fallback for undistributed funds._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _collector | address | The address of the collector. |

### setForwarder

```solidity
function setForwarder(address _forwarder) external
```

Sets the forwarder contract address used for handling interactions with the BIC token.

_Can only be set by an operator. Emits a SetForwarder event upon success.
Using to help controller can bid in auction on behalf of a user want to mint handle but end up in case auction._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _forwarder | address | The address of the BIC forwarder contract. |

### requestHandle

```solidity
function requestHandle(struct HandlesController.HandleRequest rq, uint256 validUntil, uint256 validAfter, bytes signature) external
```

Processes handle requests, supports direct minting or auctions.

_Validates the request verifier's signature, mints handles, or initializes auctions.
Handles are minted directly or auctioned based on the request parameters._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| rq | struct HandlesController.HandleRequest | The handle request details including receiver, price, and auction settings. |
| validUntil | uint256 | The timestamp until when the request is valid. |
| validAfter | uint256 | The timestamp after which the request is valid. |
| signature | bytes | The cryptographic signature to validate the request's authenticity. |

### collectAuctionPayout

```solidity
function collectAuctionPayout(uint256 auctionId, uint256 amount, address[] beneficiaries, uint256[] collects, bytes signature) external
```

Collects the auction payouts after an auction concludes in the Thirdweb Marketplace. [LINK]: https://github.com/thirdweb-dev/contracts/tree/main/contracts/prebuilts/marketplace/english-auctions
The function will revert if:

     - The auction associated with the handle is not marked as canClaim.
     - The provided signature does not validate against the expected payload signed by the authorized signer.

_This function is called after a successful auction on the Thirdweb Marketplace to distribute the auction proceeds.
     The process involves two main steps:

     1. The winning bidder claims the auction amount through the Thirdweb Marketplace contract, which transfers the funds to this HandleController contract.

     2. This function is then called to distribute these funds among the predefined beneficiaries according to the specified shares.

     This function ensures that only valid, unclaimed auctions can be processed and verifies the operation via signature.

     It checks that the auction was marked as claimable, verifies the provided signature to ensure it comes from a valid source, and then performs the payout.

     Once the payout is completed, it marks the auction as claimed to prevent re-claiming._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| auctionId | uint256 | The ID of the auction in the Thirdweb Marketplace contract. |
| amount | uint256 | The total amount of Ether or tokens to be distributed to the beneficiaries. |
| beneficiaries | address[] |  |
| collects | uint256[] |  |
| signature | bytes | The signature from the authorized verifier to validate the claim operation. |

### _emitCommitment

```solidity
function _emitCommitment(struct HandlesController.HandleRequest rq, bytes32 _dataHash, uint256 endTime, bool _isClaimed) internal
```

Handles commitments for minting handles with a delay.

_Internal function to handle commitments for minting handles with a delay.
Three cases, decision to mint handle is based on user's request and BIC back-end logic:
     1. User want a NFT and can mint directly buy using BIC
     2. User want a NFT but cannot mint directly, so user commit to mint NFT
     3. User want a NFT but cannot mint directly, and nether can commit it. So controller mint NFT and put it in auction_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| rq | struct HandlesController.HandleRequest | The handle request details including receiver, price, and auction settings. |
| _dataHash | bytes32 | The hash committment |
| endTime | uint256 |  |
| _isClaimed | bool | The status of claim |

### withdraw

```solidity
function withdraw(address token, address to, uint256 amount) external
```

Allows withdrawal of funds or tokens from the contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The address of the token to withdraw, or address(0) for native Ether. |
| to | address | The recipient of the funds or tokens. |
| amount | uint256 | The amount to withdraw. |

### getRequestHandleOp

```solidity
function getRequestHandleOp(struct HandlesController.HandleRequest rq, uint256 validUntil, uint256 validAfter) public view returns (bytes32)
```

Allows the operator to claim tokens sent to the contract by mistake.

_Generates a unique hash for a handle request operation based on multiple parameters.
if tx is commit, its require commit duration > validUntil - validAfter because requirement can flexibly collects and beneficiaries_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| rq | struct HandlesController.HandleRequest | The handle request details including receiver, price, and auction settings. |
| validUntil | uint256 | The timestamp until when the request is valid. |
| validAfter | uint256 | The timestamp after when the request is valid. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The unique hash for the handle request operation. |

### getCollectAuctionPayoutOp

```solidity
function getCollectAuctionPayoutOp(uint256 auctionId, uint256 amount, address[] beneficiaries, uint256[] collects) public view returns (bytes32)
```

Generates a unique hash for a collect auction payout operation.

_Generates a unique hash for a collect auction payout operation._

### burnHandleMintedButAuctionFailed

```solidity
function burnHandleMintedButAuctionFailed(address handle, string name) external
```

Allows the operator to burn a handle that was minted when case the auction failed (none bid).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| handle | address | The address of the handle contract. |
| name | string | The name of the handle. |

