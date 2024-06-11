// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {IBicPermissions} from "../management/interfaces/IBicPermissions.sol";

interface IBicForwarder {
    event Requested(address indexed controller, address indexed from, address indexed to, bytes data, uint256 value);
    struct RequestData {
        address from;
        address to;
        bytes data;
        uint256 value;
    }

    function forwardRequest(RequestData memory requestData) external;
}

contract BicForwarder is IBicForwarder {
    IBicPermissions public immutable bicPermissions;

    constructor(IBicPermissions _bp) {
        bicPermissions = _bp;
    }

    /**
     * @notice Ensures that the function is called only by the operator.
     */
    modifier onController() {
        require(
            bicPermissions.hasRole(
                bicPermissions.CONTROLLER_ROLE(),
                msg.sender
            ),
            "HandlesController: caller is not a controller"
        );
        _;
    }

    function forwardRequest(RequestData memory requestData) external onController override {
        (bool success, bytes memory returnData) = requestData.to.call{value: requestData.value}(
            abi.encodePacked(requestData.data, requestData.from)
        );
        if (!success) {
            // Get the reason for the failed transaction
            string memory reason = _getRevertReason(returnData);
            revert(reason);
        }
        emit Requested(msg.sender, requestData.from, requestData.to, requestData.data, requestData.value);
    }

    /**
     * @notice Internal function to get the revert reason from the return data
     * @param _returnData The return data from the external call
     * @return The revert reason string
     */
    function _getRevertReason(bytes memory _returnData) internal pure returns (string memory) {
        if (_returnData.length < 68) {
            return "Forwarding request failed";
        }
        assembly {
            _returnData := add(_returnData, 0x04)
        }
        return abi.decode(_returnData, (string));
    }
}
    