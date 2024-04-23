# Solidity API

## BicPermissions

a contract that manages permissions for the BIC system.

_the contract uses the AccessControlEnumerable contract from OpenZeppelin._

### RECOVERY_ROLE

```solidity
bytes32 RECOVERY_ROLE
```

the role that can recover the contract.Using this on BicAccount

### OPERATOR_ROLE

```solidity
bytes32 OPERATOR_ROLE
```

the role that can operate the contract. Using this role on HandlesController, HandlesTokenURI and BicAccount

### constructor

```solidity
constructor() public
```

## IHandleTokenURI

### getTokenURI

```solidity
function getTokenURI(uint256 tokenId, string localName, string namespace) external view returns (string)
```

## HandleTokenURI

The contract leverages the BicPermissions contract to check for operator permissions.

_This contract is responsible for generating a token URI based on metadata elements associated with namespaces. It uses permission controls to manage who can set these metadata elements._

### permissions

```solidity
contract BicPermissions permissions
```

The permissions contract used to manage operator roles.

### NameElement

```solidity
struct NameElement {
  string imageDescription;
  string imageURI;
}
```

### nameElements

```solidity
mapping(string => struct HandleTokenURI.NameElement) nameElements
```

### SetNameElement

```solidity
event SetNameElement(string namespace, string imageDescription, string imageURI)
```

Emitted when a name element is set

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string |  |
| imageDescription | string | the description of the name (aka Beincom - Earning Username) |
| imageURI | string | the uri for svg background name image |

### constructor

```solidity
constructor(contract BicPermissions _permissions) public
```

Initializes the contract with the given permissions contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _permissions | contract BicPermissions | management |

### onlyOperator

```solidity
modifier onlyOperator()
```

Ensures that the function is called only by the operator.

### setNameElement

```solidity
function setNameElement(string namespace, string imageDescription, string imageURI) external
```

Sets the metadata elements for a given namespace.

_This function is accessible only to operators._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string | The namespace to associate with the metadata elements. |
| imageDescription | string | The description of the image for the namespace. |
| imageURI | string | The URI for the image for the namespace. |

### getNameElement

```solidity
function getNameElement(string namespace) external view returns (string, string)
```

Retrieves the metadata elements associated with a specific namespace.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string | The namespace for which metadata elements are queried. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | imageDescription The description of the image. |
| [1] | string | imageURI The URI of the image. |

### getImageURI

```solidity
function getImageURI(string namespace, string localName) internal view returns (string)
```

_Internal function to concatenate the base image URI with the local name query parameter._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string | The namespace used to retrieve the base URI. |
| localName | string | The local name used as a query parameter. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The full image URI including the query parameter. |

### getImageDescription

```solidity
function getImageDescription(string namespace, string localName) internal view returns (string)
```

_Internal function to generate the image description including the local name._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string | The namespace used to retrieve the base description. |
| localName | string | The local name appended to the base description. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The full image description. |

### getTokenURI

```solidity
function getTokenURI(uint256 tokenId, string localName, string namespace) external view returns (string)
```

Generates a complete token URI with metadata for a specific token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The identifier for the token. |
| localName | string | The local name associated with the token. |
| namespace | string | The namespace under which the token was minted. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The complete token URI in base64-encoded JSON format. |

## BicAccount

BicAccount is a simple account abstraction contract, with owner and operator roles.
The owner can execute transactions, change owner, and deposit/withdraw funds.
The operator can execute transactions.
The recovery role can change the owner.

_Based on eth-infinitism SimpleAccount_

### owner

```solidity
address owner
```

### permissions

```solidity
contract BicPermissions permissions
```

### BicAccountInitialized

```solidity
event BicAccountInitialized(contract IEntryPoint entryPoint, address owner)
```

### NewOwner

```solidity
event NewOwner(address oldOwner, address newOwner)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### entryPoint

```solidity
function entryPoint() public view virtual returns (contract IEntryPoint)
```

return the entryPoint used by this account.
subclass should return the current entryPoint used by this account.

### receive

```solidity
receive() external payable
```

### constructor

```solidity
constructor(contract IEntryPoint anEntryPoint) public
```

### _onlyOwner

```solidity
function _onlyOwner() internal view
```

### _onlyOwnerOrHasRecoveryRole

```solidity
function _onlyOwnerOrHasRecoveryRole() internal view
```

### _onlyOwnerOrHasOperatorRole

```solidity
function _onlyOwnerOrHasOperatorRole() internal view
```

### changeOwner

```solidity
function changeOwner(address _newOwner) external
```

Change owner or recovery the other owner (called directly from owner, or by entryPoint)

### execute

```solidity
function execute(address dest, uint256 value, bytes func) external
```

execute a transaction (called directly from owner, or by entryPoint)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| dest | address | destination address to call |
| value | uint256 | the value to pass in this call |
| func | bytes | the calldata to pass in this call |

### executeBatch

```solidity
function executeBatch(address[] dest, uint256[] value, bytes[] func) external
```

execute a sequence of transactions

_to reduce gas consumption for trivial case (no value), use a zero-length array to mean zero value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| dest | address[] | an array of destination addresses |
| value | uint256[] | an array of values to pass to each call. can be zero-length for no-value calls |
| func | bytes[] | an array of calldata to pass to each call |

### initialize

```solidity
function initialize(address anOwner, contract BicPermissions _permissions) public virtual
```

_The _entryPoint member is immutable, to reduce gas consumption.  To upgrade EntryPoint,
a new implementation of SimpleAccount must be deployed with the new EntryPoint address, then upgrading
the implementation by calling `upgradeTo()`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| anOwner | address | the owner (signer) of this account |
| _permissions | contract BicPermissions |  |

### _initialize

```solidity
function _initialize(address anOwner, contract BicPermissions _permissions) internal virtual
```

### _requireFromEntryPointOrOwner

```solidity
function _requireFromEntryPointOrOwner() internal view
```

### _validateSignature

```solidity
function _validateSignature(struct UserOperation userOp, bytes32 userOpHash) internal virtual returns (uint256 validationData)
```

validate the signature is valid for this message.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct UserOperation | validate the userOp.signature field |
| userOpHash | bytes32 | convenient field: the hash of the request, to check the signature against          (also hashes the entrypoint and chain id) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| validationData | uint256 | signature and time-range of this operation      <20-byte> sigAuthorizer - 0 for valid signature, 1 to mark signature failure,         otherwise, an address of an "authorizer" contract.      <6-byte> validUntil - last timestamp this operation is valid. 0 for "indefinite"      <6-byte> validAfter - first timestamp this operation is valid      If the account doesn't use time-range, it is enough to return SIG_VALIDATION_FAILED value (1) for signature failure.      Note that the validation code cannot use block.timestamp (or block.number) directly. |

### _call

```solidity
function _call(address target, uint256 value, bytes data) internal
```

### getDeposit

```solidity
function getDeposit() public view returns (uint256)
```

check current account deposit in the entryPoint

### addDeposit

```solidity
function addDeposit() public payable
```

deposit more funds for this account in the entryPoint

### withdrawDepositTo

```solidity
function withdrawDepositTo(address payable withdrawAddress, uint256 amount) public
```

withdraw value from the account's deposit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| withdrawAddress | address payable | target to send to |
| amount | uint256 | to withdraw |

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal view
```

Upgrade the implementation of the account

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newImplementation | address | the new implementation contract address |

### version

```solidity
function version() external pure virtual returns (uint256)
```

Version for BicAccount

## BicAccountFactory

A UserOperations "initCode" holds the address of the factory, and a method call (to createAccount, in this sample factory).
The factory's createAccount returns the target account address even if it is already installed.
This way, the entryPoint.getSenderAddress() can be called either before or after the account is created.

### accountImplementation

```solidity
contract BicAccount accountImplementation
```

### permissions

```solidity
contract BicPermissions permissions
```

### constructor

```solidity
constructor(contract IEntryPoint _entryPoint, contract BicPermissions _permissions) public
```

### createAccount

```solidity
function createAccount(address owner, uint256 salt) public returns (contract BicAccount ret)
```

create an account, and return its address.

_Note that during UserOperation execution, this method is called only if the account is not deployed.
This method returns an existing account address so that entryPoint.getSenderAddress() would work even after account creation_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | the owner of the account |
| salt | uint256 | the salt to calculate the account address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| ret | contract BicAccount | is the address even if the account is already deployed. |

### getAddress

```solidity
function getAddress(address owner, uint256 salt) public view returns (address)
```

calculate the counterfactual address of this account as it would be returned by createAccount()

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | the owner of the account |
| salt | uint256 | the salt to calculate the account address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | the address of the account |

## BicTokenPaymaster

The paymaster IS the token to use, since a paymaster cannot use an external contract.
Also, the exchange rate has to be fixed, since it can't reference an external Uniswap or other exchange contract.
subclass should override "getTokenValueOfEth" to provide actual token exchange rate, settable by the owner.
Known Limitation: this paymaster is exploitable when put into a batch with multiple ops (of different accounts):
- while a single op can't exploit the paymaster (if postOp fails to withdraw the tokens, the user's op is reverted,
  and then we know we can withdraw the tokens), multiple ops with different senders (all using this paymaster)
  in a batch can withdraw funds from 2nd and further ops, forcing the paymaster itself to pay (from its deposit)
- Possible workarounds are either use a more complex paymaster scheme (e.g. the DepositPaymaster) or
  to whitelist the account and the called method ids.

### COST_OF_POST

```solidity
uint256 COST_OF_POST
```

### theFactory

```solidity
address theFactory
```

### oracle

```solidity
address oracle
```

### constructor

```solidity
constructor(address accountFactory, contract IEntryPoint _entryPoint) public
```

### setOracle

```solidity
function setOracle(address _oracle) external
```

set the oracle to use for token exchange rate.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _oracle | address | the oracle to use. |

### transferOwnership

```solidity
function transferOwnership(address newOwner) public virtual
```

transfer paymaster ownership.
owner of this paymaster is allowed to withdraw funds (tokens transferred to this paymaster's balance)
when changing owner, the old owner's withdrawal rights are revoked.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOwner | address | the new owner of the paymaster. |

### getTokenValueOfEth

```solidity
function getTokenValueOfEth(uint256 valueEth) internal view virtual returns (uint256 valueToken)
```

token to eth exchange rate.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| valueEth | uint256 | the value in eth to convert to tokens. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| valueToken | uint256 | the value in tokens. |

### _validatePaymasterUserOp

```solidity
function _validatePaymasterUserOp(struct UserOperation userOp, bytes32, uint256 requiredPreFund) internal view returns (bytes context, uint256 validationData)
```

validate the request:
if this is a constructor call, make sure it is a known account.
verify the sender has enough tokens.
(since the paymaster is also the token, there is no notion of "approval")

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct UserOperation | the user operation to validate. |
|  | bytes32 |  |
| requiredPreFund | uint256 | the required pre-fund for the operation. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| context | bytes | the context to pass to postOp. |
| validationData | uint256 | the validation data. |

### _validateConstructor

```solidity
function _validateConstructor(struct UserOperation userOp) internal view virtual
```

validate the constructor code and parameters.

_when constructing an account, validate constructor code and parameters
we trust our factory (and that it doesn't have any other public methods)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct UserOperation | the user operation to validate. |

### _postOp

```solidity
function _postOp(enum IPaymaster.PostOpMode mode, bytes context, uint256 actualGasCost) internal
```

actual charge of user.

_this method will be called just after the user's TX with mode==OpSucceeded|OpReverted (account pays in both cases)
BUT: if the user changed its balance in a way that will cause  postOp to revert, then it gets called again, after reverting
the user's TX , back to the state it was before the transaction started (before the validatePaymasterUserOp),
and the transaction should succeed there._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| mode | enum IPaymaster.PostOpMode | the mode of the operation. |
| context | bytes | the context to pass to postOp. |
| actualGasCost | uint256 | the actual gas cost of the operation. |

## VerifyingTokenPayAfterPaymaster

a paymaster that verifies a signature over the UserOperation, and pays the gas with the user's tokens.

_the signature is over the UserOperation, except the paymasterAndData, which contains the signature itself.
the signature is over the hash of the UserOperation, the chainId, the paymaster address, the sender nonce, the token, the validUntil and the validAfter.
the signature is verified by the verifyingSigner.
the gas cost is paid by the user's tokens, using the token oracle._

### COST_OF_POST

```solidity
uint256 COST_OF_POST
```

### verifyingSigner

```solidity
address verifyingSigner
```

### constructor

```solidity
constructor(contract IEntryPoint _entryPoint, address _verifyingSigner) public
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _entryPoint | contract IEntryPoint | the entry point contract to use. |
| _verifyingSigner | address | the signer to verify the signature. |

### senderNonce

```solidity
mapping(address => uint256) senderNonce
```

### oracles

```solidity
mapping(address => contract IOracle) oracles
```

### pack

```solidity
function pack(struct UserOperation userOp) internal pure returns (bytes ret)
```

pack the UserOperation, except the paymasterAndData.
this is a lighter encoding than the UserOperation.hash() method, and is used to sign the request.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct UserOperation | the UserOperation to pack. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| ret | bytes | the packed UserOperation. |

### getHash

```solidity
function getHash(struct UserOperation userOp, address token, uint48 validUntil, uint48 validAfter) public view returns (bytes32)
```

this method is called by the off-chain service, to sign the request.

_it is called on-chain from the validatePaymasterUserOp, to validate the signature.
note that this signature covers all fields of the UserOperation, except the "paymasterAndData",
which will carry the signature itself._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | the hash we're going to sign off-chain (and validate on-chain) |

### _validatePaymasterUserOp

```solidity
function _validatePaymasterUserOp(struct UserOperation userOp, bytes32, uint256 requiredPreFund) internal returns (bytes context, uint256 validationData)
```

verify our external signer signed this request.

_the "paymasterAndData" is expected to be the paymaster and a signature over the entire request params
paymasterAndData[:20] : address(this)
paymasterAndData[20:40] : token address
paymasterAndData[40:104] : abi.encode(validUntil, validAfter)
paymasterAndData[104:] : signature_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct UserOperation | the UserOperation to validate. |
|  | bytes32 |  |
| requiredPreFund | uint256 | the required pre-fund for the operation. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| context | bytes | the context to pass to postOp. |
| validationData | uint256 | the validation data. |

### _postOp

```solidity
function _postOp(enum IPaymaster.PostOpMode mode, bytes context, uint256 actualGasCost) internal
```

pay the gas with the user's tokens.

_we don't really care about the mode, we just pay the gas with the user's tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| mode | enum IPaymaster.PostOpMode | the mode of the operation. |
| context | bytes | the context to pass to postOp. |
| actualGasCost | uint256 | the actual gas cost of the operation. |

### parsePaymasterAndData

```solidity
function parsePaymasterAndData(bytes paymasterAndData) public pure returns (address token, uint48 validUntil, uint48 validAfter, bytes signature)
```

parse the paymasterAndData field.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| paymasterAndData | bytes | the paymasterAndData field to parse. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | adresss of token to use. |
| validUntil | uint48 | timestamp. |
| validAfter | uint48 | timestamp. |
| signature | bytes | of the request. |

### setOracle

```solidity
function setOracle(address token, contract IOracle oracle) public
```

set the oracle for a token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token to set the oracle for. |
| oracle | contract IOracle | the oracle to set. |

### withdrawTokensTo

```solidity
function withdrawTokensTo(contract IERC20 token, address target, uint256 amount) public
```

withdraw tokens to a target address.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20 | the token to withdraw. |
| target | address | the target address to withdraw to. |
| amount | uint256 | the amount to withdraw. |

## BicAccount1

### constructor

```solidity
constructor(contract IEntryPoint anEntryPoint) public
```

### version

```solidity
function version() external pure returns (uint256)
```

Version for BicAccount

## BicAccount2

### constructor

```solidity
constructor(contract IEntryPoint anEntryPoint) public
```

### version

```solidity
function version() external pure returns (uint256)
```

Version for BicAccount

## BicFactory

This contract allows users to deploy minimal proxies (clones) for a specified implementation contract

_Uses OpenZeppelin's Clones library for creating deterministic minimal proxy contracts_

### ProxyDeployed

```solidity
event ProxyDeployed(address implementation, address proxy, address deployer)
```

Emitted when a new proxy is deployed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| implementation | address | The address of the implementation contract the proxy uses |
| proxy | address | The address of the newly deployed proxy |
| deployer | address | The address of the user who deployed the proxy |

### deployProxyByImplementation

```solidity
function deployProxyByImplementation(address _implementation, bytes _data, bytes32 _salt) public returns (address deployedProxy)
```

Deploys a new minimal proxy contract for a given implementation

_The `_data` can include an initialization function call_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _implementation | address | The address of the implementation contract to clone |
| _data | bytes | Initialization data to be called on the new proxy contract immediately after its deployment |
| _salt | bytes32 | A nonce used to create a unique deterministic address for the proxy contract |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| deployedProxy | address | The address of the newly created proxy contract |

### computeProxyAddress

```solidity
function computeProxyAddress(address _implementation, bytes32 _salt) public view returns (address)
```

## IBicPermissions

### RECOVERY_ROLE

```solidity
function RECOVERY_ROLE() external pure returns (bytes32)
```

### OPERATOR_ROLE

```solidity
function OPERATOR_ROLE() external pure returns (bytes32)
```

## IMarketplace

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

## HandlesErrors

### HandleLengthInvalid

```solidity
error HandleLengthInvalid()
```

### HandleContainsInvalidCharacters

```solidity
error HandleContainsInvalidCharacters()
```

### HandleFirstCharInvalid

```solidity
error HandleFirstCharInvalid()
```

### NotOwner

```solidity
error NotOwner()
```

### NotController

```solidity
error NotController()
```

### DoesNotExist

```solidity
error DoesNotExist()
```

### NotEOA

```solidity
error NotEOA()
```

### DisablingAlreadyTriggered

```solidity
error DisablingAlreadyTriggered()
```

### AlreadyEnabled

```solidity
error AlreadyEnabled()
```

### NotOperator

```solidity
error NotOperator()
```

### NotImplemented

```solidity
error NotImplemented()
```

## HandlesEvents

### HandleMinted

```solidity
event HandleMinted(string handle, string namespace, uint256 handleId, address to, uint256 timestamp)
```

### BatchMetadataUpdate

```solidity
event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId)
```

_Emitted when a collection's token URI is updated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| fromTokenId | uint256 | The ID of the smallest token that requires its token URI to be refreshed. |
| toTokenId | uint256 | The ID of the biggest token that requires its token URI to be refreshed. Max uint256 to refresh all of them. |

## HandlesController

_Manages operations related to handle auctions and direct handle requests, including minting and claim payouts.
Uses ECDSA for signature verification and integrates with a marketplace for auction functionalities._

### AuctionRequest

Represents a request for an auction, including the ability to claim the handle, the beneficiaries, and their respective shares of the proceeds.

_Represents a request for an auction, including the ability to claim the handle, the beneficiaries, and their respective shares of the proceeds._

```solidity
struct AuctionRequest {
  bool canClaim;
  address[] beneficiaries;
  uint256[] collects;
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

### _bicPermissions

```solidity
contract IBicPermissions _bicPermissions
```

_The permissions contract used to manage operator roles._

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

### nameToAuctionRequest

```solidity
mapping(string => struct HandlesController.AuctionRequest) nameToAuctionRequest
```

_Mapping from handle names to their corresponding auction requests, managing the state and distribution of auctioned handles._

### MintHandle

```solidity
event MintHandle(address handle, address to, string name, uint256 price)
```

_Emitted when a handle is minted, providing details of the transaction including the handle address, recipient, name, and price._

### Commitment

```solidity
event Commitment(bytes32 commitment, uint256 endTimestamp)
```

_Emitted when a commitment is made, providing details of the commitment and its expiration timestamp._

### SetVerifier

```solidity
event SetVerifier(address verifier)
```

_Emitted when the verifier address is updated._

### SetMarketplace

```solidity
event SetMarketplace(address marketplace)
```

_Emitted when the marketplace address is updated._

### CreateAuction

```solidity
event CreateAuction(uint256 auctionId)
```

_Emitted when an auction is created, providing details of the auction ID._

### constructor

```solidity
constructor(contract IBicPermissions _bp, contract IERC20 _bic) public
```

Initializes the HandlesController contract with the given permissions contract and BIC token.

### onlyOperator

```solidity
modifier onlyOperator()
```

Ensures that the function is called only by the operator.

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
function collectAuctionPayout(string name, uint256 amount, bytes signature) external
```

Collects the auction payouts after an auction concludes in the Thirdweb Marketplace. [LINK]: https://github.com/thirdweb-dev/contracts/tree/main/contracts/prebuilts/marketplace/english-auctions

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
| name | string | The name of the handle associated with the auction. |
| amount | uint256 | The total amount of Ether or tokens to be distributed to the beneficiaries. |
| signature | bytes | The signature from the authorized verifier to validate the claim operation. The function will revert if:      - The auction associated with the handle is not marked as canClaim.      - The provided signature does not validate against the expected payload signed by the authorized signer. |

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

_Generates a unique hash for a handle request operation based on multiple parameters._

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
function getCollectAuctionPayoutOp(string name, uint256 amount) public view returns (bytes32)
```

Generates a unique hash for a collect auction payout operation.

_Generates a unique hash for a collect auction payout operation._

## Handles

_This contract utilizes ERC721Upgradeable for tokenization of handles. Each handle represents a unique identifier within a specified namespace.
Handles are formed by appending a local name to a namespace, separated by "0x40". This contract allows minting and burning of handles, alongside basic management of their attributes.
Designed to be used with a Transparent upgradeable proxy without requiring an initializer._

### CONTROLLER

```solidity
address CONTROLLER
```

Address of the controller with administrative privileges.

### OPERATOR

```solidity
address OPERATOR
```

Address of the operator who can perform certain restricted operations.

### _localNames

```solidity
mapping(uint256 => string) _localNames
```

_Mapping from token ID to the local name of the handle._

### _handleTokenURIContract

```solidity
address _handleTokenURIContract
```

_Address of the contract responsible for generating token URIs._

### onlyOperator

```solidity
modifier onlyOperator()
```

Ensures that the function is called only by the operator.

### onlyController

```solidity
modifier onlyController()
```

Ensures that the function is called only by the controller.

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(string namespace, string name, string symbol, address operator) public
```

Initializes the contract with the given namespace and ERC721 token details.

_Initializes the contract with the given namespace and ERC721 token details._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string | The namespace under which all handles are created. |
| name | string | The name of the ERC721 token. |
| symbol | string | The symbol of the ERC721 token. |
| operator | address | The address of the operator who can perform certain restricted operations. |

### totalSupply

```solidity
function totalSupply() external view virtual returns (uint256)
```

Returns the total supply of minted tokens.

_Returns the total supply of minted tokens._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total supply of minted tokens. |

### setController

```solidity
function setController(address controller) external
```

Sets a new controller address.

_Sets a new controller address for the contract with restricted privileges._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| controller | address | The address of the new controller. |

### setOperator

```solidity
function setOperator(address operator) external
```

Sets a new operator address.

_Sets a new operator address for the contract with restricted privileges._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | The address of the new operator. |

### setHandleTokenURIContract

```solidity
function setHandleTokenURIContract(address handleTokenURIContract) external
```

Sets the contract address responsible for handle token URI generation.

_Sets the contract address responsible for generating token URIs with restricted privileges._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| handleTokenURIContract | address | The address of the contract responsible for generating token URIs. |

### getHandleTokenURIContract

```solidity
function getHandleTokenURIContract() external view returns (address)
```

Returns the address of the contract generating token URIs.

_Returns the address of the contract responsible for generating token URIs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The address of the contract responsible for generating token URIs. |

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view returns (string)
```

Returns the URI for a token based on its ID.

_Returns the URI for a token based on its ID with required NFT minted_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The ID of the token. |

### mintHandle

```solidity
function mintHandle(address to, string localName) external returns (uint256)
```

Mints a new handle with a given local name for the specified address.

_Mints a new handle with a given local name for the specified address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address to mint the handle for. |
| localName | string | The local name of the handle. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The ID of the minted handle. |

### burn

```solidity
function burn(uint256 tokenId) external
```

Burns a handle with a specified token ID.

_Burns a handle with a specified token ID._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The ID of the handle to burn. |

### exists

```solidity
function exists(uint256 tokenId) external view returns (bool)
```

Checks if a handle exists by its token ID.

_Checks if a handle exists by its token ID._

### getNamespace

```solidity
function getNamespace() public view virtual returns (string)
```

Retrieves the namespace of the handles.

_Retrieves the namespace of the handles._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The namespace of the handles. |

### getNamespaceHash

```solidity
function getNamespaceHash() external view returns (bytes32)
```

Returns the hash of the namespace string.

_Returns the hash of the namespace string._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The hash of the namespace string. |

### getLocalName

```solidity
function getLocalName(uint256 tokenId) public view returns (string)
```

Retrieves the local name of a handle by its token ID.

_Retrieves the local name of a handle by its token ID._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The ID of the handle. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The local name of the handle. |

### getHandle

```solidity
function getHandle(uint256 tokenId) public view returns (string)
```

Constructs the complete handle from a token ID.

_Constructs the complete handle from a token ID._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The ID of the handle. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The handle with the namespace and local name. |

### getTokenId

```solidity
function getTokenId(string localName) public pure returns (uint256)
```

Generates a token ID based on a given local name.

_Generates a token ID based on a given local name._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| localName | string | The local name of the handle. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The token ID of the handle. |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

Returns true if this contract implements the interface defined by `interfaceId`.

_Returns true if this contract implements the interface defined by `interfaceId`._

### _mintHandle

```solidity
function _mintHandle(address to, string localName) internal returns (uint256)
```

_Mints a new handle with the specified local name for a given address. This function generates a token ID based on the local name,
increments the total supply, mints the token, stores the local name associated with the token ID, and emits a HandleMinted event._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address to which the new token will be minted. |
| localName | string | The local part of the handle to be minted. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | tokenId The unique token ID of the minted handle. |

## IHandles

### mintHandle

```solidity
function mintHandle(address to, string localName) external returns (uint256)
```

### burn

```solidity
function burn(uint256 tokenId) external
```

### getNamespace

```solidity
function getNamespace() external view returns (string)
```

### getNamespaceHash

```solidity
function getNamespaceHash() external view returns (bytes32)
```

### exists

```solidity
function exists(uint256 tokenId) external view returns (bool)
```

### getLocalName

```solidity
function getLocalName(uint256 tokenId) external view returns (string)
```

### getHandle

```solidity
function getHandle(uint256 tokenId) external view returns (string)
```

### getTokenId

```solidity
function getTokenId(string localName) external pure returns (uint256)
```

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

### setController

```solidity
function setController(address controller) external
```

### getHandleTokenURIContract

```solidity
function getHandleTokenURIContract() external view returns (address)
```

### setHandleTokenURIContract

```solidity
function setHandleTokenURIContract(address handleTokenURIContract) external
```

## BicUnlockFactory

This contract allows users to create time-locked token unlock contracts

### UnlockInitialized

```solidity
event UnlockInitialized(address unlock, address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 unlockRate)
```

Emitted when a new unlock contract is initialized

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| unlock | address | Address of the new unlock contract |
| erc20 | address | Address of the ERC20 token |
| totalAmount | uint256 | Total amount of tokens to be unlocked over time |
| beneficiaryAddress | address | Address of the beneficiary who is receivied the unlocked tokens |
| durationSeconds | uint64 | Duration of the unlock in seconds |
| unlockRate | uint64 | Percentage of the total amount that is unlocked per duration |

### bicUnlockImplementation

```solidity
contract BicUnlockToken bicUnlockImplementation
```

Address of the BicUnlockToken implementation used for creating new clones

_This is a clone factory pattern_

### unlockAddress

```solidity
mapping(address => address) unlockAddress
```

Mapping of beneficiary addresses to their unlock contract addresses

_This is used to prevent multiple unlock contracts from being created for the same beneficiary_

### constructor

```solidity
constructor() public
```

Initializes the BicUnlockFactory contract

_This sets the bicUnlockImplementation to a new BicUnlockToken instance_

### createUnlock

```solidity
function createUnlock(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 unlockRate) public returns (contract BicUnlockToken ret)
```

Creates a new unlock contract for a beneficiary using the specified parameters

_Deploys a clone of `bicUnlockImplementation`, initializes it, and transfers the required tokens_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| erc20 | address | The address of the ERC20 token to lock |
| totalAmount | uint256 | The total amount of tokens to lock |
| beneficiaryAddress | address | The address of the beneficiary who can claim the tokens |
| durationSeconds | uint64 | The duration over which the tokens will unlock |
| unlockRate | uint64 | The percentage of total tokens to unlock per interval |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| ret | contract BicUnlockToken | The address of the newly created unlock token contract |

### computeUnlock

```solidity
function computeUnlock(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 unlockRate) public view returns (address)
```

Computes the address of a potential unlock contract for a given set of parameters

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| erc20 | address | The address of the ERC20 token involved |
| totalAmount | uint256 | The total amount of tokens potentially to lock |
| beneficiaryAddress | address | The address of the potential beneficiary |
| durationSeconds | uint64 | The potential duration of the unlock |
| unlockRate | uint64 | The percentage of total tokens to unlock at each interval |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | predicted The address of the potential unlock contract |

### _getHash

```solidity
function _getHash(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 unlockRate) public pure returns (bytes32)
```

Computes a hash of the unlock parameters

_This hash is used for creating deterministic addresses for clone contracts_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| erc20 | address | The address of the ERC20 token |
| totalAmount | uint256 | The total amount of tokens |
| beneficiaryAddress | address | The address of the beneficiary |
| durationSeconds | uint64 | The duration of the unlock |
| unlockRate | uint64 | The percentage of the total amount to be unlocked per interval |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | hash The computed hash of the parameters |

## BicUnlockToken

Manages the locked tokens, allowing beneficiaries to claim their tokens after a vesting period

_This contract uses OpenZeppelin's Initializable and ReentrancyGuard to provide initialization and reentrancy protection_

### ERC20Released

```solidity
event ERC20Released(address beneficiary, uint256 amount, uint256 currentRewardStacks, uint256 stacks, uint64 timestamp)
```

Emitted when tokens are released to the beneficiary

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beneficiary | address | The address of the beneficiary who received the tokens |
| amount | uint256 | The amount of tokens released |
| currentRewardStacks | uint256 | The current stack count of rewards released |
| stacks | uint256 | The total number of stacks that will be released |
| timestamp | uint64 | The block timestamp when the release occurred |

### DENOMINATOR

```solidity
uint64 DENOMINATOR
```

The denominator used for calculating percentages, 100% = 10_000, 10% = 1_000, 1% = 100, 0.1% = 10, 0.01% = 1

_This is used to calculate the unlock rate_

### constructor

```solidity
constructor() public payable
```

_Constructor is empty and payment is disabled by default_

### initialize

```solidity
function initialize(address erc20Address, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 unlockRateNumber) public virtual
```

Initializes the contract with necessary parameters to start the vesting process

_Ensure all parameters are valid, particularly that addresses are not zero and amounts are positive_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| erc20Address | address | The ERC20 token address to be locked in the contract |
| totalAmount | uint256 | The total amount of tokens that will be locked |
| beneficiaryAddress | address | The address of the beneficiary who will receive the tokens after vesting |
| durationSeconds | uint64 | The duration of the vesting period in seconds |
| unlockRateNumber | uint64 | The rate at which the tokens will be released per duration |

### erc20

```solidity
function erc20() public view virtual returns (address)
```

Getter for the ERC20 token address

_This function returns the address of the ERC20 token that is locked in the contract_

### unlockTotalAmount

```solidity
function unlockTotalAmount() public view virtual returns (uint256)
```

Getter for the total amount of tokens locked in the contract

_This function returns the total amount of tokens that are locked in the contract_

### unlockRate

```solidity
function unlockRate() public view virtual returns (uint64)
```

Getter for the unlock rate

_This function returns the unlock rate, which is the percentage of tokens that will be released per duration_

### beneficiary

```solidity
function beneficiary() public view virtual returns (address)
```

Getter for the beneficiary address

_This function returns the address of the beneficiary who will receive the tokens after vesting_

### start

```solidity
function start() public view virtual returns (uint256)
```

Getter for the start timestamp

_This function returns the start timestamp of the vesting period_

### end

```solidity
function end() public view virtual returns (uint256)
```

Getter for the end timestamp

_This function returns the end timestamp of the vesting period_

### duration

```solidity
function duration() public view virtual returns (uint256)
```

Getter for the duration of the vesting period

_This function returns the duration of the vesting period_

### lastAtCurrentStack

```solidity
function lastAtCurrentStack() public view virtual returns (uint256)
```

Getter for the last timestamp at the current reward stack

_This function returns the last timestamp at the current reward stack_

### maxRewardStacks

```solidity
function maxRewardStacks() public view virtual returns (uint256)
```

Getter for the maximum reward stacks

_This function returns the maximum reward stacks_

### currentRewardStacks

```solidity
function currentRewardStacks() public view virtual returns (uint256)
```

Getter for the current reward stacks

_This function returns the current reward stacks_

### amountPerDuration

```solidity
function amountPerDuration() public view virtual returns (uint256)
```

Getter for the amount of tokens that will be released per duration

_This function returns the amount of tokens that will be released per duration_

### released

```solidity
function released() public view virtual returns (uint256)
```

Getter for the amount of tokens that have been released

_This function returns the amount of tokens that have been released to the beneficiary_

### releasable

```solidity
function releasable() public view virtual returns (uint256, uint256)
```

Calculates the amount of tokens that are currently available for release

_This function uses the vesting formula to calculate the amount of tokens that can be released_

### release

```solidity
function release() public virtual
```

Allows the beneficiary to release vested tokens

_This function includes checks for the amount of tokens available for release token and updates internal states_

### _vestingSchedule

```solidity
function _vestingSchedule(uint64 timestamp) internal view virtual returns (uint256, uint256)
```

_Internal function to calculate the vesting schedule and determine releasable amount and reward stacks_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| timestamp | uint64 | The current block timestamp |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | amount The amount of tokens that can be released at this timestamp |
| [1] | uint256 | counter The number of reward stacks that have been released at this timestamp |

### _amountPerDuration

```solidity
function _amountPerDuration() internal view virtual returns (uint256)
```

_Internal helper function to calculate the amount of tokens per duration_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The calculated amount of tokens that should be released per duration based on the total amount and unlock rate |

### _lastAtCurrentStack

```solidity
function _lastAtCurrentStack() internal view virtual returns (uint256)
```

_Internal helper function to calculate the last timestamp at which tokens were released based on the current reward stacks_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The timestamp of the last release |

## BicToken

### PAUSER_ROLE

```solidity
bytes32 PAUSER_ROLE
```

### BLACK_LIST_ROLE

```solidity
bytes32 BLACK_LIST_ROLE
```

### TRANSFER_ROLE

```solidity
bytes32 TRANSFER_ROLE
```

### timeUnlockTransfer

```solidity
uint256 timeUnlockTransfer
```

### constructor

```solidity
constructor() public
```

### BlockAddress

```solidity
event BlockAddress(address addr, uint256 time)
```

### UnblockAddress

```solidity
event UnblockAddress(address addr, uint256 time)
```

### UpdateTimeUnlockTransfer

```solidity
event UpdateTimeUnlockTransfer(uint256 timeUnlock, uint256 time)
```

### blacklist

```solidity
mapping(address => bool) blacklist
```

### blockAddress

```solidity
function blockAddress(address addr) public
```

### unblockAddress

```solidity
function unblockAddress(address addr) public
```

### pause

```solidity
function pause() public virtual
```

### unpause

```solidity
function unpause() public virtual
```

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

### updateTimeUnlockTransfer

```solidity
function updateTimeUnlockTransfer(uint256 _timeUnlockTransfer) public
```

## SimpleClaim

### root

```solidity
bytes32 root
```

### bic

```solidity
contract IERC20 bic
```

### constructor

```solidity
constructor(bytes32 _root, contract IERC20 _bic) public
```

### claim

```solidity
function claim(bytes32[] proof, address claimAddress, uint256 index, uint256 amount) external
```

## TestERC20

### constructor

```solidity
constructor() public
```

## TestERC721

### constructor

```solidity
constructor() public
```

### safeMint

```solidity
function safeMint() public
```

## TestErc20Constructor

### contractName

```solidity
address contractName
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(string name, string symbol) public
```

## TestMarketplace

### auctionId

```solidity
uint256 auctionId
```

### createAuction

```solidity
function createAuction(struct IMarketplace.AuctionParameters _auctionParams) external returns (uint256 id)
```

### bidInAuction

```solidity
function bidInAuction(uint256 _auctionId, uint256 _bidAmount) external
```

### collectAuctionPayout

```solidity
function collectAuctionPayout(uint256 _auctionId) external
```

### collectAuctionTokens

```solidity
function collectAuctionTokens(uint256 _auctionId) external
```

## TestOracle

### getTokenValueOfEth

```solidity
function getTokenValueOfEth(uint256 ethOutput) external pure returns (uint256 tokenInput)
```

return amount of tokens that are required to receive that much eth.

## TestUniswap

Very basic simulation of what Uniswap does with the swaps for the unit tests on the TokenPaymaster

_Do not use to test any actual Uniswap interaction logic as this is way too simplistic_

### StubUniswapExchangeEvent

```solidity
event StubUniswapExchangeEvent(uint256 amountIn, uint256 amountOut, address tokenIn, address tokenOut)
```

### exactOutputSingle

```solidity
function exactOutputSingle(struct ISwapRouter.ExactOutputSingleParams params) external returns (uint256)
```

### exactInputSingle

```solidity
function exactInputSingle(struct ISwapRouter.ExactInputSingleParams params) external returns (uint256)
```

### receive

```solidity
receive() external payable
```

## WrapEth

### constructor

```solidity
constructor() public
```

### receive

```solidity
receive() external payable
```

### deposit

```solidity
function deposit() public payable
```

### withdraw

```solidity
function withdraw(uint256 amount) public
```

## EntryPointTest

### constructor

```solidity
constructor() public
```

## TestERC20

### constructor

```solidity
constructor(string name, string symbol) public
```

## IBaseHandles

### mintHandle

```solidity
function mintHandle(address to, string localName) external returns (uint256)
```

### burn

```solidity
function burn(uint256 tokenId) external
```

### getNamespace

```solidity
function getNamespace() external pure returns (string)
```

### getNamespaceHash

```solidity
function getNamespaceHash() external pure returns (bytes32)
```

### exists

```solidity
function exists(uint256 tokenId) external view returns (bool)
```

### getLocalName

```solidity
function getLocalName(uint256 tokenId) external view returns (string)
```

### getHandle

```solidity
function getHandle(uint256 tokenId) external view returns (string)
```

### getTokenId

```solidity
function getTokenId(string localName) external pure returns (uint256)
```

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

### setController

```solidity
function setController(address controller) external
```

### getHandleTokenURIContract

```solidity
function getHandleTokenURIContract() external view returns (address)
```

### setHandleTokenURIContract

```solidity
function setHandleTokenURIContract(address handleTokenURIContract) external
```

## FunctionNotFound

```solidity
error FunctionNotFound(bytes4 _selector)
```

## BicDiamond

### constructor

```solidity
constructor(contract IBicPermissions _permissions, struct IDiamondLoupe.FacetCut[] _params) internal payable
```

### fallback

```solidity
fallback() external payable virtual
```

### _delegate

```solidity
function _delegate(address facet) internal virtual
```

### getImplementationForFunction

```solidity
function getImplementationForFunction(bytes4 _functionSelector) public view virtual returns (address implementation)
```

### receive

```solidity
receive() external payable virtual
```

Lets a contract receive native tokens.

## IDiamondLoupe

### FacetCutAction

```solidity
enum FacetCutAction {
  Add,
  Replace,
  Remove
}
```

### FacetCut

```solidity
struct FacetCut {
  address facetAddress;
  enum IDiamondLoupe.FacetCutAction action;
  bytes4[] functionSelectors;
}
```

### Facet

```solidity
struct Facet {
  address facetAddress;
  bytes4[] functionSelectors;
}
```

### DiamondCut

```solidity
event DiamondCut(struct IDiamondLoupe.FacetCut[] _diamondCut)
```

### diamondCut

```solidity
function diamondCut(struct IDiamondLoupe.FacetCut[] _diamondCut) external
```

Add, Replce, Remove selector

### facets

```solidity
function facets() external view returns (struct IDiamondLoupe.Facet[] facets_)
```

### facetFunctionSelectors

```solidity
function facetFunctionSelectors(address _facet) external view returns (bytes4[] facetFunctionSelectors_)
```

### facetAddresses

```solidity
function facetAddresses() external view returns (address[] facetAddresses_)
```

### facetAddress

```solidity
function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_)
```

## LibBicPermission

### BIC_PERMISSION_STORAGE_POSITION

```solidity
bytes32 BIC_PERMISSION_STORAGE_POSITION
```

_keccak256(abi.encode(uint256(keccak256("direct.listings.storage")) - 1)) & ~bytes32(uint256(0xff))_

### Data

```solidity
struct Data {
  contract IBicPermissions bicPermisson;
}
```

### getData

```solidity
function getData() internal pure returns (struct LibBicPermission.Data data_)
```

### _setBicPermision

```solidity
function _setBicPermision(contract IBicPermissions _bicPermission) internal
```

### _bicPermissionStorage

```solidity
function _bicPermissionStorage() internal pure returns (struct LibBicPermission.Data data)
```

## NoSelectorsGivenToAdd

```solidity
error NoSelectorsGivenToAdd()
```

## NotContractOwner

```solidity
error NotContractOwner(address _user, address _contractOwner)
```

## NoSelectorsProvidedForFacetForCut

```solidity
error NoSelectorsProvidedForFacetForCut(address _facetAddress)
```

## CannotAddSelectorsToZeroAddress

```solidity
error CannotAddSelectorsToZeroAddress(bytes4[] _selectors)
```

## NoBytecodeAtAddress

```solidity
error NoBytecodeAtAddress(address _contractAddress, string _message)
```

## IncorrectFacetCutAction

```solidity
error IncorrectFacetCutAction(uint8 _action)
```

## CannotAddFunctionToDiamondThatAlreadyExists

```solidity
error CannotAddFunctionToDiamondThatAlreadyExists(bytes4 _selector)
```

## CannotReplaceFunctionsFromFacetWithZeroAddress

```solidity
error CannotReplaceFunctionsFromFacetWithZeroAddress(bytes4[] _selectors)
```

## CannotReplaceImmutableFunction

```solidity
error CannotReplaceImmutableFunction(bytes4 _selector)
```

## CannotReplaceFunctionWithTheSameFunctionFromTheSameFacet

```solidity
error CannotReplaceFunctionWithTheSameFunctionFromTheSameFacet(bytes4 _selector)
```

## CannotReplaceFunctionThatDoesNotExists

```solidity
error CannotReplaceFunctionThatDoesNotExists(bytes4 _selector)
```

## RemoveFacetAddressMustBeZeroAddress

```solidity
error RemoveFacetAddressMustBeZeroAddress(address _facetAddress)
```

## CannotRemoveFunctionThatDoesNotExist

```solidity
error CannotRemoveFunctionThatDoesNotExist(bytes4 _selector)
```

## CannotRemoveImmutableFunction

```solidity
error CannotRemoveImmutableFunction(bytes4 _selector)
```

## InitializationFunctionReverted

```solidity
error InitializationFunctionReverted(address _initializationContractAddress, bytes _calldata)
```

## DiamondLoupe

### constructor

```solidity
constructor() internal
```

### onlyAuthorizedCall

```solidity
modifier onlyAuthorizedCall()
```

### diamondCut

```solidity
function diamondCut(struct IDiamondLoupe.FacetCut[] _params) external
```

### _addFunctions

```solidity
function _addFunctions(address _facetAddress, bytes4[] _functionSelectors) internal
```

### _replaceFunctions

```solidity
function _replaceFunctions(address _facetAddress, bytes4[] _functionSelectors) internal
```

### _removeFunctions

```solidity
function _removeFunctions(address _facetAddress, bytes4[] _functionSelectors) internal
```

### facets

```solidity
function facets() external view returns (struct IDiamondLoupe.Facet[] facets_)
```

### facetFunctionSelectors

```solidity
function facetFunctionSelectors(address _facet) external view returns (bytes4[] _facetFunctionSelectors)
```

### facetAddresses

```solidity
function facetAddresses() external view returns (address[] facetAddresses_)
```

### facetAddress

```solidity
function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_)
```

### _getFacetAddress

```solidity
function _getFacetAddress(bytes4 _functionSelector) internal view returns (address facetAddress_)
```

### _diamondCut

```solidity
function _diamondCut(struct IDiamondLoupe.FacetCut[] _params) internal
```

### _isAuthorizedCallToUpgrade

```solidity
function _isAuthorizedCallToUpgrade() internal view virtual returns (bool)
```

## DiamondLoupeStorage

### LOUPE_STORAGE_POSITION

```solidity
bytes32 LOUPE_STORAGE_POSITION
```

### FacetAddressAndSelectorPosition

```solidity
struct FacetAddressAndSelectorPosition {
  address facetAddress;
  uint16 selectorPosition;
}
```

### Data

```solidity
struct Data {
  mapping(bytes4 => struct DiamondLoupeStorage.FacetAddressAndSelectorPosition) facetAddressAndSelectorPosition;
  bytes4[] selectors;
  mapping(bytes4 => bool) supportedInterfaces;
}
```

### data

```solidity
function data() internal pure returns (struct DiamondLoupeStorage.Data data_)
```

_Returns access to the extension manager's storage._

## BicMarketplace

### MarketplaceConstructorParams

```solidity
struct MarketplaceConstructorParams {
  address royaltyEngineAddress;
  address nativeTokenWrapper;
}
```

### constructor

```solidity
constructor(struct BicMarketplace.MarketplaceConstructorParams _param, contract IBicPermissions _permissions, struct IDiamondLoupe.FacetCut[] _facetCut) public
```

### _canSetPlatformFeeInfo

```solidity
function _canSetPlatformFeeInfo() internal view returns (bool)
```

_Checks whether platform fee info can be set in the given execution context._

### _canSetRoyaltyEngine

```solidity
function _canSetRoyaltyEngine() internal view returns (bool)
```

_Returns whether royalty engine address can be set in the given execution context._

### _hasRole

```solidity
function _hasRole(bytes32 _role, address _account) internal view returns (bool)
```

_Checks whether an account has a particular role._

### _isAuthorizedCallToUpgrade

```solidity
function _isAuthorizedCallToUpgrade() internal view virtual returns (bool)
```

## DirectListingsLogic

### onlyListerRole

```solidity
modifier onlyListerRole()
```

_Checks whether the caller has LISTER_ROLE._

### onlyAssetRole

```solidity
modifier onlyAssetRole(address _asset)
```

_Checks whether the caller has ASSET_ROLE._

### onlyListingCreator

```solidity
modifier onlyListingCreator(uint256 _listingId)
```

_Checks whether caller is a listing creator._

### onlyExistingListing

```solidity
modifier onlyExistingListing(uint256 _listingId)
```

_Checks whether a listing exists._

### constructor

```solidity
constructor(address _nativeTokenWrapper) public
```

### createListing

```solidity
function createListing(struct IDirectListings.ListingParameters _params) external returns (uint256 listingId)
```

List NFTs (ERC721 or ERC1155) for sale at a fixed price.

### updateListing

```solidity
function updateListing(uint256 _listingId, struct IDirectListings.ListingParameters _params) external
```

Update parameters of a listing of NFTs.

### cancelListing

```solidity
function cancelListing(uint256 _listingId) external
```

Cancel a listing.

### approveBuyerForListing

```solidity
function approveBuyerForListing(uint256 _listingId, address _buyer, bool _toApprove) external
```

Approve a buyer to buy from a reserved listing.

### approveCurrencyForListing

```solidity
function approveCurrencyForListing(uint256 _listingId, address _currency, uint256 _pricePerTokenInCurrency) external
```

Approve a currency as a form of payment for the listing.

### buyFromListing

```solidity
function buyFromListing(uint256 _listingId, address _buyFor, uint256 _quantity, address _currency, uint256 _expectedTotalPrice) external payable
```

Buy NFTs from a listing.

### totalListings

```solidity
function totalListings() external view returns (uint256)
```

@notice Returns the total number of listings created.
 @dev At any point, the return value is the ID of the next listing created.

### isBuyerApprovedForListing

```solidity
function isBuyerApprovedForListing(uint256 _listingId, address _buyer) external view returns (bool)
```

Returns whether a buyer is approved for a listing.

### isCurrencyApprovedForListing

```solidity
function isCurrencyApprovedForListing(uint256 _listingId, address _currency) external view returns (bool)
```

Returns whether a currency is approved for a listing.

### currencyPriceForListing

```solidity
function currencyPriceForListing(uint256 _listingId, address _currency) external view returns (uint256)
```

Returns the price per token for a listing, in the given currency.

### getAllListings

```solidity
function getAllListings(uint256 _startId, uint256 _endId) external view returns (struct IDirectListings.Listing[] _allListings)
```

Returns all non-cancelled listings.

### getAllValidListings

```solidity
function getAllValidListings(uint256 _startId, uint256 _endId) external view returns (struct IDirectListings.Listing[] _validListings)
```

@notice Returns all valid listings between the start and end Id (both inclusive) provided.
         A valid listing is where the listing creator still owns and has approved Marketplace
         to transfer the listed NFTs.

### getListing

```solidity
function getListing(uint256 _listingId) external view returns (struct IDirectListings.Listing listing)
```

Returns a listing at a particular listing ID.

### _getNextListingId

```solidity
function _getNextListingId() internal returns (uint256 id)
```

_Returns the next listing Id._

### _getTokenType

```solidity
function _getTokenType(address _assetContract) internal view returns (enum IDirectListings.TokenType tokenType)
```

_Returns the interface supported by a contract._

### _validateNewListing

```solidity
function _validateNewListing(struct IDirectListings.ListingParameters _params, enum IDirectListings.TokenType _tokenType) internal view
```

_Checks whether the listing creator owns and has approved marketplace to transfer listed tokens._

### _validateExistingListing

```solidity
function _validateExistingListing(struct IDirectListings.Listing _targetListing) internal view returns (bool isValid)
```

_Checks whether the listing exists, is active, and if the lister has sufficient balance._

### _validateOwnershipAndApproval

```solidity
function _validateOwnershipAndApproval(address _tokenOwner, address _assetContract, uint256 _tokenId, uint256 _quantity, enum IDirectListings.TokenType _tokenType) internal view returns (bool isValid)
```

_Validates that `_tokenOwner` owns and has approved Marketplace to transfer NFTs._

### _validateERC20BalAndAllowance

```solidity
function _validateERC20BalAndAllowance(address _tokenOwner, address _currency, uint256 _amount) internal view
```

_Validates that `_tokenOwner` owns and has approved Markeplace to transfer the appropriate amount of currency_

### _transferListingTokens

```solidity
function _transferListingTokens(address _from, address _to, uint256 _quantity, struct IDirectListings.Listing _listing) internal
```

_Transfers tokens listed for sale in a direct or auction listing._

### _payout

```solidity
function _payout(address _payer, address _payee, address _currencyToUse, uint256 _totalPayoutAmount, struct IDirectListings.Listing _listing) internal
```

_Pays out stakeholders in a sale._

### _directListingsStorage

```solidity
function _directListingsStorage() internal pure returns (struct DirectListingsStorage.Data data)
```

_Returns the DirectListings storage._

## BaseHandles

A handle is defined as a local name inside a namespace context. A handle is represented as the local name with its
namespace applied as a prefix, using the slash symbol as separator.

     handle = namespace /@ localName

Handle and local name can be used interchangeably once you are in a context of a namespace, as it became redundant.

     handle === ${localName} ; inside some namespace.

### CONTROLLER

```solidity
address CONTROLLER
```

### MAX_LOCAL_NAME_LENGTH

```solidity
uint256 MAX_LOCAL_NAME_LENGTH
```

### _localNames

```solidity
mapping(uint256 => string) _localNames
```

### _handleTokenURIContract

```solidity
address _handleTokenURIContract
```

### onlyOperator

```solidity
modifier onlyOperator()
```

### onlyEOA

```solidity
modifier onlyEOA()
```

### onlyController

```solidity
modifier onlyController()
```

### constructor

```solidity
constructor(contract IBicPermissions _bp) public
```

### name

```solidity
function name() public pure virtual returns (string)
```

_See {IERC721Metadata-name}._

### symbol

```solidity
function symbol() public pure virtual returns (string)
```

_See {IERC721Metadata-symbol}._

### totalSupply

```solidity
function totalSupply() external view virtual returns (uint256)
```

### setController

```solidity
function setController(address controller) external
```

### setHandleTokenURIContract

```solidity
function setHandleTokenURIContract(address handleTokenURIContract) external
```

### getHandleTokenURIContract

```solidity
function getHandleTokenURIContract() external view returns (address)
```

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view returns (string)
```

_See {IERC721Metadata-tokenURI}._

### mintHandle

```solidity
function mintHandle(address to, string localName) external returns (uint256)
```

### migrateHandle

```solidity
function migrateHandle(address to, string localName) external returns (uint256)
```

### burn

```solidity
function burn(uint256 tokenId) external
```

### exists

```solidity
function exists(uint256 tokenId) external view returns (bool)
```

### getNamespace

```solidity
function getNamespace() public pure virtual returns (string)
```

### getNamespaceHash

```solidity
function getNamespaceHash() external pure returns (bytes32)
```

### getLocalName

```solidity
function getLocalName(uint256 tokenId) public view returns (string)
```

### getHandle

```solidity
function getHandle(uint256 tokenId) public view returns (string)
```

### getTokenId

```solidity
function getTokenId(string localName) public pure returns (uint256)
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

### _mintHandle

```solidity
function _mintHandle(address to, string localName) internal returns (uint256)
```

INTERNAL FUNCTIONS      ///

### _validateLocalNameMigration

```solidity
function _validateLocalNameMigration(string localName) internal pure
```

_This function is used to validate the local name when migrating from V1 to V2.
     As in V1 we also allowed the Hyphen '-' character, we need to allow it here as well and use a separate
     validation function for migration VS newly created handles._

### _validateLocalName

```solidity
function _validateLocalName(string localName) internal pure
```

_In V2 we only accept the following characters: [a-z0-9_] to be used in newly created handles.
     We also disallow the first character to be an underscore '_'._

### _isAlphaNumeric

```solidity
function _isAlphaNumeric(bytes1 char) internal pure returns (bool)
```

_We only accept lowercase characters to avoid confusion._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| char | bytes1 | The character to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the character is alphanumeric, false otherwise. |

## BicHandlers

### constructor

```solidity
constructor(contract IBicPermissions _bp) public
```

### name

```solidity
function name() public pure returns (string)
```

_See {IERC721Metadata-name}._

### symbol

```solidity
function symbol() public pure returns (string)
```

_See {IERC721Metadata-symbol}._

### getNamespace

```solidity
function getNamespace() public pure returns (string)
```

## CommHandlers

### constructor

```solidity
constructor(contract IBicPermissions _bp) public
```

### name

```solidity
function name() public pure returns (string)
```

_See {IERC721Metadata-name}._

### symbol

```solidity
function symbol() public pure returns (string)
```

_See {IERC721Metadata-symbol}._

### getNamespace

```solidity
function getNamespace() public pure returns (string)
```

## TestERC1155

### GOLD

```solidity
uint256 GOLD
```

### SILVER

```solidity
uint256 SILVER
```

### THORS_HAMMER

```solidity
uint256 THORS_HAMMER
```

### SWORD

```solidity
uint256 SWORD
```

### SHIELD

```solidity
uint256 SHIELD
```

### constructor

```solidity
constructor() public
```

### safeMint

```solidity
function safeMint(uint256 i) public
```

## TestERCInvalid

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

## FacetNotFound

### getBlockNumber

```solidity
function getBlockNumber() external view returns (uint256)
```

## TestBicDiamond

### constructor

```solidity
constructor(contract IBicPermissions _permissions, struct IDiamondLoupe.FacetCut[] _params) public
```

### _isAuthorizedCallToUpgrade

```solidity
function _isAuthorizedCallToUpgrade() internal view virtual returns (bool)
```

## TestDirectListingsLogicV2

### increaseTotalListing

```solidity
function increaseTotalListing(uint256 _count) external
```

### decreaseTotalListing

```solidity
function decreaseTotalListing(uint256 _count) external
```

### totalListings

```solidity
function totalListings() external view returns (uint256)
```

### setNumber

```solidity
function setNumber() external
```

### getNumber

```solidity
function getNumber() external view returns (uint256)
```

### _directListingsStorage

```solidity
function _directListingsStorage() internal pure returns (struct TestDirectListingsStorageV2.Data data)
```

_Returns the DirectListings storage._

## TestDirectListingsStorageV2

### DIRECT_LISTINGS_STORAGE_POSITION

```solidity
bytes32 DIRECT_LISTINGS_STORAGE_POSITION
```

_keccak256(abi.encode(uint256(keccak256("direct.listings.storage")) - 1)) & ~bytes32(uint256(0xff))_

### Data

```solidity
struct Data {
  uint256 totalListings;
  uint256 random;
}
```

### data

```solidity
function data() internal pure returns (struct TestDirectListingsStorageV2.Data data_)
```

## TestDirectListingsLogic

### onlyOperatorRole

```solidity
modifier onlyOperatorRole()
```

### duplicate

```solidity
function duplicate() external
```

### increaseTotalListing

```solidity
function increaseTotalListing(uint256 _count) external
```

### decreaseTotalListing

```solidity
function decreaseTotalListing(uint256 _count) external
```

### totalListings

```solidity
function totalListings() external view returns (uint256)
```

### _directListingsStorage

```solidity
function _directListingsStorage() internal pure returns (struct TestDirectListingsStorage.Data data)
```

_Returns the DirectListings storage._

## TestDirectListingsStorage

### DIRECT_LISTINGS_STORAGE_POSITION

```solidity
bytes32 DIRECT_LISTINGS_STORAGE_POSITION
```

_keccak256(abi.encode(uint256(keccak256("direct.listings.storage")) - 1)) & ~bytes32(uint256(0xff))_

### Data

```solidity
struct Data {
  uint256 totalListings;
}
```

### data

```solidity
function data() internal pure returns (struct TestDirectListingsStorage.Data data_)
```

## TestEnglishAuctionsLogic

### mulTotalAuctions

```solidity
function mulTotalAuctions(uint256 _count) external
```

### divTotalAuctions

```solidity
function divTotalAuctions(uint256 _count) external
```

### totalAuctions

```solidity
function totalAuctions() external view returns (uint256)
```

### _englishAuctionsStorage

```solidity
function _englishAuctionsStorage() internal pure returns (struct TestEnglishAuctionsStorage.Data data)
```

_Returns the DirectListings storage._

## TestEnglishAuctionsStorage

### ENGLISH_AUCTIONS_STORAGE_POSITION

```solidity
bytes32 ENGLISH_AUCTIONS_STORAGE_POSITION
```

_keccak256(abi.encode(uint256(keccak256("english.auctions.storage")) - 1)) & ~bytes32(uint256(0xff))_

### Data

```solidity
struct Data {
  uint256 totalAuctions;
}
```

### data

```solidity
function data() internal pure returns (struct TestEnglishAuctionsStorage.Data data_)
```

## MockRoyaltyEngineV1

### mockRecipients

```solidity
address payable[] mockRecipients
```

### mockAmounts

```solidity
uint256[] mockAmounts
```

### constructor

```solidity
constructor(address payable[] _mockRecipients, uint256[] _mockAmounts) public
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

### getRoyalty

```solidity
function getRoyalty(address tokenAddress, uint256 tokenId, uint256 value) public view returns (address payable[] recipients, uint256[] amounts)
```

Get the royalty for a given token (address, id) and value amount.  Does not cache the bps/amounts.  Caches the spec for a given token address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenAddress | address | - The address of the token |
| tokenId | uint256 | - The id of the token |
| value | uint256 | - The value you wish to get the royalty of returns Two arrays of equal length, royalty recipients and the corresponding amount each recipient should get |

### getRoyaltyView

```solidity
function getRoyaltyView(address tokenAddress, uint256 tokenId, uint256 value) public view returns (address payable[] recipients, uint256[] amounts)
```

View only version of getRoyalty

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenAddress | address | - The address of the token |
| tokenId | uint256 | - The id of the token |
| value | uint256 | - The value you wish to get the royalty of returns Two arrays of equal length, royalty recipients and the corresponding amount each recipient should get |

## UsernameHandles

### MIN_LOCAL_NAME_LENGTH

```solidity
uint256 MIN_LOCAL_NAME_LENGTH
```

### MAX_LOCAL_NAME_LENGTH

```solidity
uint256 MAX_LOCAL_NAME_LENGTH
```

### constructor

```solidity
constructor(contract IBicPermissions _bp) public
```

### name

```solidity
function name() public pure virtual returns (string)
```

_See {IERC721Metadata-name}._

### symbol

```solidity
function symbol() public pure virtual returns (string)
```

_See {IERC721Metadata-symbol}._

### getNamespace

```solidity
function getNamespace() public pure virtual returns (string)
```

### _validateLocalName

```solidity
function _validateLocalName(string localName) internal pure virtual
```

### _isAlphaNumeric

```solidity
function _isAlphaNumeric(bytes1 char) internal pure returns (bool)
```

_We only accept lowercase characters to avoid confusion._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| char | bytes1 | The character to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the character is alphanumeric, false otherwise. |

## Earning

### getEarningRate

```solidity
function getEarningRate() external view returns (uint32, uint32)
```

### setEarningRate

```solidity
function setEarningRate(uint32 numerator, uint32 denominator) public virtual
```

### calculateEarning

```solidity
function calculateEarning(uint256 amount) external view returns (uint256)
```

## EarningUsernameHandles

### constructor

```solidity
constructor(contract IBicPermissions _bp) public
```

### name

```solidity
function name() public pure virtual returns (string)
```

_See {IERC721Metadata-name}._

### symbol

```solidity
function symbol() public pure virtual returns (string)
```

_See {IERC721Metadata-symbol}._

### getNamespace

```solidity
function getNamespace() public pure virtual returns (string)
```

### setEarningRate

```solidity
function setEarningRate(uint32 numerator, uint32 denominator) public
```

## IEarning

### getEarningRate

```solidity
function getEarningRate() external view returns (uint32, uint32)
```

### setEarningRate

```solidity
function setEarningRate(uint32 numerator, uint32 denominator) external
```

### calculateEarning

```solidity
function calculateEarning(uint256 amount) external view returns (uint256)
```

## GintoNordFontSVG

### getFontStyle

```solidity
function getFontStyle() external pure returns (string)
```

## HandleSVG

### MAX_WIDTH

```solidity
uint256 MAX_WIDTH
```

### FaceColors

```solidity
enum FaceColors {
  GREEN,
  PEACH,
  PURPLE,
  BLUE,
  GOLD,
  BLACK
}
```

### getHandleSVG

```solidity
function getHandleSVG(string localName) public pure returns (string)
```

### getGoldHandleSVG

```solidity
function getGoldHandleSVG(string localName) internal pure returns (string)
```

### getBlackHandleSVG

```solidity
function getBlackHandleSVG(string localName) internal pure returns (string)
```

### getBaseHandleSVG

```solidity
function getBaseHandleSVG(string localName, enum HandleSVG.FaceColors baseColor) internal pure returns (string)
```

### getBaseColor

```solidity
function getBaseColor(string localName) internal pure returns (enum HandleSVG.FaceColors)
```

### getBaseBg

```solidity
function getBaseBg(enum HandleSVG.FaceColors faceColor) internal pure returns (string)
```

### getLensBaseFace

```solidity
function getLensBaseFace(enum HandleSVG.FaceColors faceColor) internal pure returns (string)
```

### getTextElement

```solidity
function getTextElement(string localName) internal pure returns (string)
```

### getBaseFaceColor

```solidity
function getBaseFaceColor(enum HandleSVG.FaceColors faceColor) internal pure returns (string)
```

### getBaseGradients

```solidity
function getBaseGradients() internal pure returns (string)
```

### CharWidth

```solidity
struct CharWidth {
  bytes1 char;
  uint256 width;
}
```

### getCharWidth

```solidity
function getCharWidth(bytes1 char) internal pure returns (uint256)
```

### getWidthFromFontsize

```solidity
function getWidthFromFontsize(uint256 fontSize) internal pure returns (uint256)
```

### getFontsizeFromWidth10x

```solidity
function getFontsizeFromWidth10x(uint256 width) internal pure returns (uint256)
```

### getTextWidth

```solidity
function getTextWidth(string text) internal pure returns (uint256)
```

### getFittingLength

```solidity
function getFittingLength(string text, uint256 maxWidth) internal pure returns (uint256)
```

### splitTextToFit

```solidity
function splitTextToFit(string text) internal pure returns (string, string)
```

## CommunityNameHandles

### MAX_LOCAL_NAME_LENGTH

```solidity
uint256 MAX_LOCAL_NAME_LENGTH
```

### constructor

```solidity
constructor(contract IBicPermissions _bp) public
```

### name

```solidity
function name() public pure virtual returns (string)
```

_See {IERC721Metadata-name}._

### symbol

```solidity
function symbol() public pure virtual returns (string)
```

_See {IERC721Metadata-symbol}._

### getNamespace

```solidity
function getNamespace() public pure virtual returns (string)
```

### _validateLocalName

```solidity
function _validateLocalName(string localName) internal pure virtual
```

## EarningCommunityNameHandles

### constructor

```solidity
constructor(contract IBicPermissions _bp) public
```

### name

```solidity
function name() public pure virtual returns (string)
```

_See {IERC721Metadata-name}._

### symbol

```solidity
function symbol() public pure virtual returns (string)
```

_See {IERC721Metadata-symbol}._

### getNamespace

```solidity
function getNamespace() public pure virtual returns (string)
```

### setEarningRate

```solidity
function setEarningRate(uint32 numerator, uint32 denominator) public
```

