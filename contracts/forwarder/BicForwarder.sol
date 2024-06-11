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
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");
    IBicPermissions public immutable bicPermissions;


    constructor(IBicPermissions _bp) {
        bicPermissions = _bp;
    }

    /**
     * @notice Ensures that the function is called only by the controller.
     */
    modifier onController() {
        require(
            bicPermissions.hasRole(
                // bicPermissions.CONTROLLER_ROLE(),
                CONTROLLER_ROLE,
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
        // If the _returnData length is less than 68, then the transaction failed silently (without a revert message)
        // 68 bytes = 4 bytes (function selector) + 32 bytes (offset) + 32 bytes (string length)
        if (_returnData.length < 68) {
            return "Forwarding request failed";
        }
        assembly {
            // Slice the sighash (first 4 bytes of the _returnData)
            // This skips the function selector (0x08c379a0 for Error(string)) to get to the actual error message
            _returnData := add(_returnData, 0x04)
        }
        // Decode the remaining data as a string, which contains the actual revert message
        return abi.decode(_returnData, (string));
    }
}
    