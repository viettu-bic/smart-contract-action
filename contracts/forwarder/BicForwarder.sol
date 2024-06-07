// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBicForwarder {
    struct RequestData {
        address from;
        address to;
        bytes data;
        uint256 value;
    }

    function forwardRequest(RequestData memory requestData) external;
}

contract BicForwarder is IBicForwarder {
    constructor() {}

    function forwardRequest(RequestData memory requestData) public {
        (bool success, ) = requestData.to.call{value: requestData.value}(
            abi.encodePacked(requestData.data, requestData.from)
        );
        require(success, "Forwarding request failed");
    }
}
    