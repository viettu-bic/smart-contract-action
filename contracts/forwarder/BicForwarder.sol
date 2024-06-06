// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BicForwarder {
    struct RequestData {
        address from;
        address to;
        bytes data;
        uint256 value;
    }

    constructor() {}

    function forwardRequest(RequestData memory requestData) public {
        (bool success, ) = requestData.to.call{value: requestData.value}(
            abi.encodePacked(requestData.data, requestData.from)
        );
        require(success, "Forwarding request failed");
    }
}
    