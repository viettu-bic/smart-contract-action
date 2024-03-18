// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./BicTokenUnlockV2.sol";
import "./../management/BicPermissions.sol";


contract BicUnlockFactory {
    event UnlockInitialize(address unlock);
    BicUnlockTokenV2 public immutable bicUnlockImplementation;
    BicPermissions public immutable permissions;

    constructor(BicPermissions _permissions) {
        bicUnlockImplementation = new BicUnlockTokenV2();
        permissions = _permissions;
    }

   
    function createUnlock(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 startTimestamp, uint64 countNumber, uint64 durationSeconds, uint256 salt) public returns (BicUnlockTokenV2 ret) {
        address addr = getAddress(erc20, totalAmount, beneficiaryAddress, startTimestamp, countNumber, durationSeconds, salt);
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return BicUnlockTokenV2(payable(addr));
        }

        // Transfer from BIC to Account
        SafeERC20.safeTransferFrom(IERC20(erc20), msg.sender, beneficiaryAddress, totalAmount);
        ret = BicUnlockTokenV2(payable(new ERC1967Proxy{salt : bytes32(salt)}(
                address(bicUnlockImplementation),
                abi.encodeCall(BicUnlockTokenV2.initialize, (erc20, totalAmount, beneficiaryAddress, startTimestamp, countNumber, durationSeconds)
            ))));
        emit UnlockInitialize(address(ret));
    }

    function getAddress(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 startTimestamp, uint64 countNumber, uint64 durationSeconds, uint256 salt) public view returns (address) {
        return Create2.computeAddress(bytes32(salt), keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(bicUnlockImplementation),
                    abi.encodeCall(BicUnlockTokenV2.initialize, (erc20, totalAmount, beneficiaryAddress, startTimestamp, countNumber, durationSeconds)
                )
            ))));
    }
}