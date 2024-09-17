# Solidity API

## Erc20TransferMessage

### ERC20Message

```solidity
event ERC20Message(contract IERC20 token, address from, address to, uint256 amount, string message)
```

### ERC20Charge

```solidity
event ERC20Charge(contract IERC20 token, address from, address to, uint256 amount, string message)
```

### WithdrawToken

```solidity
event WithdrawToken(contract IERC20 token, address from, address to, uint256 amount)
```

### constructor

```solidity
constructor() public
```

### transferERC20

```solidity
function transferERC20(contract IERC20 _token, address _to, uint256 _amount, string _message) external
```

### charge

```solidity
function charge(contract IERC20 _token, address _to, uint256 _amount, string _message) external
```

