// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/Clones.sol";

contract BicFactory {

    event ProxyDeployed(address indexed implementation, address proxy, address indexed deployer);

    function deployProxyByImplementation(
        address _implementation,
        bytes memory _data,
        bytes32 _salt
    ) public returns (address deployedProxy) {
        bytes32 salthash = keccak256(abi.encodePacked(msg.sender, _salt));
        deployedProxy = Clones.cloneDeterministic(_implementation, salthash);
        if (_data.length > 0) {
            (bool success, ) = deployedProxy.call(_data);
            require(success, "BicFactory: failed to initialize");
        }
        emit ProxyDeployed(_implementation, deployedProxy, msg.sender);
    }

    function computeProxyAddress(
        address _implementation,
        bytes32 _salt
    ) public view returns (address) {
        bytes32 salthash = keccak256(abi.encodePacked(msg.sender, _salt));
        return Clones.predictDeterministicAddress(_implementation, salthash);
    }
}
