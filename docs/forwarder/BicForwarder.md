# Solidity API

## IBicForwarder

### Requested

```solidity
event Requested(address controller, address from, address to, bytes data, uint256 value)
```

### RequestData

```solidity
struct RequestData {
  address from;
  address to;
  bytes data;
  uint256 value;
}
```

### forwardRequest

```solidity
function forwardRequest(struct IBicForwarder.RequestData requestData) external
```

## BicForwarder

### CONTROLLER_ROLE

```solidity
bytes32 CONTROLLER_ROLE
```

### isController

```solidity
mapping(address => bool) isController
```

### onController

```solidity
modifier onController()
```

Ensures that the function is called only by the controller.

### addController

```solidity
function addController(address _controller) external
```

### forwardRequest

```solidity
function forwardRequest(struct IBicForwarder.RequestData requestData) external
```

### _getRevertReason

```solidity
function _getRevertReason(bytes _returnData) internal pure returns (string)
```

Internal function to get the revert reason from the return data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _returnData | bytes | The return data from the external call |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The revert reason string |

