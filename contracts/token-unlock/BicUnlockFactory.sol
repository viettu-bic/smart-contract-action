// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BicUnlockToken.sol";

contract BicUnlockFactory {
    event UnlockInitialized(
        address unlock,
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 unlockRate
    );

    BicUnlockToken public immutable bicUnlockImplementation;

    mapping(address => address) public unlockAddress;

    constructor() {
        bicUnlockImplementation = new BicUnlockToken();
    }

    function createUnlock(
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 unlockRate
    ) public returns (BicUnlockToken ret) {
        require(unlockAddress[beneficiaryAddress] == address(0), "Unlock contract already deploy");

        bytes32 salthash = _getHash(erc20, totalAmount, beneficiaryAddress, durationSeconds, unlockRate);

        address addr = Clones.predictDeterministicAddress(address(bicUnlockImplementation), salthash);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return BicUnlockToken(payable(addr));
        }


        ret = BicUnlockToken(Clones.cloneDeterministic(address(bicUnlockImplementation), salthash));
        ret.initialize(erc20, totalAmount, beneficiaryAddress, durationSeconds, unlockRate);

        // Transfer from BIC to Account
        SafeERC20.safeTransferFrom(IERC20(erc20), msg.sender, address(ret), totalAmount);
        
        unlockAddress[beneficiaryAddress] = address(ret);
        emit UnlockInitialized(address(ret), erc20, totalAmount, beneficiaryAddress, durationSeconds, unlockRate);
    }

    function computeUnlock(
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 unlockRate
    ) public view returns (address) {
        if (unlockAddress[beneficiaryAddress] != address(0)) {
            return unlockAddress[beneficiaryAddress];
        }

        bytes32 salthash = _getHash(erc20, totalAmount, beneficiaryAddress, durationSeconds, unlockRate);

        address predicted = Clones.predictDeterministicAddress(address(bicUnlockImplementation), salthash);
        
        return predicted;
    }

    function _getHash(
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 unlockRate
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(erc20, totalAmount, beneficiaryAddress, durationSeconds, unlockRate));
    }
    

}
