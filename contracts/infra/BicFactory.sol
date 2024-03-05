// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/Clones.sol";

contract BicFactory {
    function deployProxyByImplementation(
        address _implementation,
        bytes memory _data,
        bytes32 _salt
    ) public returns (address deployedProxy) {
        deployedProxy = Clones.cloneDeterministic(_implementation, _salt);
        if (_data.length > 0) {
            (bool success, ) = deployedProxy.call(_data);
            require(success, "BicFactory: failed to initialize");
        }
    }
}
