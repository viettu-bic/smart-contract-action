# Solidity API

## BicTokenPaymaster

Using this paymaster mechanism for Account Abstraction bundler v0.6,
when need to change to bundler v0.7 or higher, using TokenPaymaster instead

### COST_OF_POST

```solidity
uint256 COST_OF_POST
```

Calculated cost of the postOp, minimum value that need verificationGasLimit to be higher than

### factories

```solidity
mapping(address => bool) factories
```

The factory that creates accounts. used to validate account creation. Just to make sure not have any unexpected account creation trying to bug the system

### oracle

```solidity
address oracle
```

The oracle to use for token exchange rate.

### isBlocked

```solidity
mapping(address => bool) isBlocked
```

The blocked users

### BlockPlaced

```solidity
event BlockPlaced(address _user)
```

_Emitted when a user is blocked_

### BlockReleased

```solidity
event BlockReleased(address _user)
```

_Emitted when a user is unblocked_

### ChargeFee

```solidity
event ChargeFee(address sender, uint256 _fee)
```

_Emitted when a user is charged, using for indexing on subgraph_

### constructor

```solidity
constructor(contract IEntryPoint _entryPoint, address _owner) public
```

Constructor that make this contract become ERC20 Paymaster and also Permit

_BIC token required permit because of Account Abstraction feature
Using ERC20Permit because it is require for forwarder from Entrypoint_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _entryPoint | contract IEntryPoint | the entry point contract to use. Default is v0.6 public entry point: 0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789 |
| _owner | address | is the owner of the paymaster. Using this param to set Safe wallet as default owner |

### setOracle

```solidity
function setOracle(address _oracle) external
```

Set the oracle to use for token exchange rate.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _oracle | address | the oracle to use. |

### addFactory

```solidity
function addFactory(address _factory) external
```

Add a factory that creates accounts.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _factory | address | the factory to add. |

### transferOwnership

```solidity
function transferOwnership(address newOwner) public virtual
```

Transfer paymaster ownership.
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

Token to eth exchange rate.

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

Validate the request:

- If this is a constructor call, make sure it is a known account.
- Verify the sender has enough tokens.

_(since the paymaster is also the token, there is no notion of "approval")_

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

Validate the constructor code and parameters.

_When constructing an account, validate constructor code and parameters
We trust our factory (and that it doesn't have any other public methods)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct UserOperation | the user operation to validate. |

### _postOp

```solidity
function _postOp(enum IPaymaster.PostOpMode mode, bytes context, uint256 actualGasCost) internal
```

Actual charge of user.

_This method will be called just after the user's TX with mode==OpSucceeded|OpReverted (account pays in both cases)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| mode | enum IPaymaster.PostOpMode | the mode of the operation. |
| context | bytes | the context to pass to postOp. |
| actualGasCost | uint256 | the actual gas cost of the operation. |

### addToBlockedList

```solidity
function addToBlockedList(address _user) public
```

Blacklist a user.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | the user to blacklist. |

### removeFromBlockedList

```solidity
function removeFromBlockedList(address _user) public
```

Unblock a user.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | the user to unblock. |

### pause

```solidity
function pause() public
```

Pause transfers using this token. For emergency use.

### unpause

```solidity
function unpause() public
```

Unpause transfers using this token.

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called before any transfer of tokens.
Override existing hook to add additional checks: paused and blocked users._

