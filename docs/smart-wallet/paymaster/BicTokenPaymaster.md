# Solidity API

## BicTokenPaymaster

A sample paymaster that defines itself as a token to pay for gas.
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

### isBlocked

```solidity
mapping(address => bool) isBlocked
```

### BlockPlaced

```solidity
event BlockPlaced(address _user)
```

### BlockReleased

```solidity
event BlockReleased(address _user)
```

### constructor

```solidity
constructor(address accountFactory, contract IEntryPoint _entryPoint) public
```

### setOracle

```solidity
function setOracle(address _oracle) external
```

### mintTokens

```solidity
function mintTokens(address recipient, uint256 amount) external
```

helpers for owner, to mint and withdraw tokens.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | - the address that will receive the minted tokens. |
| amount | uint256 | - the amount it will receive. |

### transferOwnership

```solidity
function transferOwnership(address newOwner) public virtual
```

transfer paymaster ownership.
owner of this paymaster is allowed to withdraw funds (tokens transferred to this paymaster's balance)
when changing owner, the old owner's withdrawal rights are revoked.

### getTokenValueOfEth

```solidity
function getTokenValueOfEth(uint256 valueEth) internal view virtual returns (uint256 valueToken)
```

### _validatePaymasterUserOp

```solidity
function _validatePaymasterUserOp(struct PackedUserOperation userOp, bytes32, uint256 requiredPreFund) internal view returns (bytes context, uint256 validationData)
```

validate the request:
if this is a constructor call, make sure it is a known account.
verify the sender has enough tokens.
(since the paymaster is also the token, there is no notion of "approval")

### _validateConstructor

```solidity
function _validateConstructor(struct PackedUserOperation userOp) internal view virtual
```

### _postOp

```solidity
function _postOp(enum IPaymaster.PostOpMode mode, bytes context, uint256 actualGasCost, uint256 actualUserOpFeePerGas) internal
```

actual charge of user.
this method will be called just after the user's TX with mode==OpSucceeded|OpReverted (account pays in both cases)
BUT: if the user changed its balance in a way that will cause  postOp to revert, then it gets called again, after reverting
the user's TX , back to the state it was before the transaction started (before the validatePaymasterUserOp),
and the transaction should succeed there.

### addToBlockedList

```solidity
function addToBlockedList(address _user) public
```

### removeFromBlockedList

```solidity
function removeFromBlockedList(address _user) public
```

### pause

```solidity
function pause() public
```

### unpause

```solidity
function unpause() public
```

### _update

```solidity
function _update(address from, address to, uint256 amount) internal virtual
```

