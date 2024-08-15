# Solidity API

## BicRedeemFactory

This contract allows users to create time-locked token redeem contracts

### RedeemInitialized

```solidity
event RedeemInitialized(address redeem, address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 redeemRate)
```

Emitted when a new redeem contract is initialized

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeem | address | Address of the new redeem contract |
| erc20 | address | Address of the ERC20 token |
| totalAmount | uint256 | Total amount of tokens to be redeemed over time |
| beneficiaryAddress | address | Address of the beneficiary who is received the redeemed tokens |
| durationSeconds | uint64 | Duration of the redeem in seconds |
| redeemRate | uint64 | Percentage of the total amount that is redeemed per duration |

### bicRedeemImplementation

```solidity
contract BicRedeemToken bicRedeemImplementation
```

Address of the BicRedeemToken implementation used for creating new clones

_This is a clone factory pattern_

### redeemAddress

```solidity
mapping(address => address) redeemAddress
```

Mapping of beneficiary addresses to their redeem contract addresses

_This is used to prevent multiple redeem contracts from being created for the same beneficiary
Each beneficiary can only have one redeem contract for only one type of token_

### constructor

```solidity
constructor() public
```

Initializes the BicRedeemFactory contract

_This sets the bicRedeemImplementation to a new BicRedeemToken instance_

### createRedeem

```solidity
function createRedeem(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 redeemRate) public returns (contract BicRedeemToken ret)
```

Creates a new redeem contract for a beneficiary using the specified parameters

_Deploys a clone of `bicRedeemImplementation`, initializes it, and transfers the required tokens_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| erc20 | address | The address of the ERC20 token to lock |
| totalAmount | uint256 | The total amount of tokens to lock |
| beneficiaryAddress | address | The address of the beneficiary who can claim the tokens |
| durationSeconds | uint64 | The duration over which the tokens will redeem |
| redeemRate | uint64 | The percentage of total tokens to redeem per interval |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| ret | contract BicRedeemToken | The address of the newly created redeem token contract |

### computeRedeem

```solidity
function computeRedeem(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 redeemRate) public view returns (address)
```

Computes the address of a potential redeem contract for a given set of parameters

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| erc20 | address | The address of the ERC20 token involved |
| totalAmount | uint256 | The total amount of tokens potentially to lock |
| beneficiaryAddress | address | The address of the potential beneficiary |
| durationSeconds | uint64 | The potential duration of the redeem |
| redeemRate | uint64 | The percentage of total tokens to redeem at each interval |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | predicted The address of the potential redeem contract |

### _getHash

```solidity
function _getHash(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 redeemRate) public pure returns (bytes32)
```

Computes a hash of the redeem parameters

_This hash is used for creating deterministic addresses for clone contracts_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| erc20 | address | The address of the ERC20 token |
| totalAmount | uint256 | The total amount of tokens |
| beneficiaryAddress | address | The address of the beneficiary |
| durationSeconds | uint64 | The duration of the redeem |
| redeemRate | uint64 | The percentage of the total amount to be redeemed per interval |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | hash The computed hash of the parameters |

