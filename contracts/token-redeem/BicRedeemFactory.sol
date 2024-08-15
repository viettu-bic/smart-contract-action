// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BicRedeemToken.sol";

/// @title BicRedeemFactory for creating and managing ERC20 token redeems
/// @notice This contract allows users to create time-locked token redeem contracts
contract BicRedeemFactory {
    /// @notice Emitted when a new redeem contract is initialized
    /// @param redeem Address of the new redeem contract
    /// @param erc20 Address of the ERC20 token
    /// @param totalAmount Total amount of tokens to be redeemed over time
    /// @param beneficiaryAddress Address of the beneficiary who is received the redeemed tokens
    /// @param durationSeconds Duration of the redeem in seconds
    /// @param redeemRate Percentage of the total amount that is redeemed per duration
    event RedeemInitialized(
        address redeem,
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 redeemRate
    );

    /// @notice Address of the BicRedeemToken implementation used for creating new clones
    /// @dev This is a clone factory pattern
    BicRedeemToken public immutable bicRedeemImplementation;

    /// @notice Mapping of beneficiary addresses to their redeem contract addresses
    /// @dev This is used to prevent multiple redeem contracts from being created for the same beneficiary
    mapping(address => address) public redeemAddress;

    /// @notice Initializes the BicRedeemFactory contract
    /// @dev This sets the bicRedeemImplementation to a new BicRedeemToken instance
    constructor() {
        bicRedeemImplementation = new BicRedeemToken();
    }

    /// @notice Creates a new redeem contract for a beneficiary using the specified parameters
    /// @dev Deploys a clone of `bicRedeemImplementation`, initializes it, and transfers the required tokens
    /// @param erc20 The address of the ERC20 token to lock
    /// @param totalAmount The total amount of tokens to lock
    /// @param beneficiaryAddress The address of the beneficiary who can claim the tokens
    /// @param durationSeconds The duration over which the tokens will redeem
    /// @param redeemRate The percentage of total tokens to redeem per interval
    /// @return ret The address of the newly created redeem token contract
    function createRedeem(
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 redeemRate
    ) public returns (BicRedeemToken ret) {
        require(redeemAddress[beneficiaryAddress] == address(0), "Redeem contract already deploy");

        bytes32 salthash = _getHash(erc20, totalAmount, beneficiaryAddress, durationSeconds, redeemRate);

        address addr = Clones.predictDeterministicAddress(address(bicRedeemImplementation), salthash);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return BicRedeemToken(payable(addr));
        }


        ret = BicRedeemToken(Clones.cloneDeterministic(address(bicRedeemImplementation), salthash));
        ret.initialize(erc20, totalAmount, beneficiaryAddress, uint64(block.timestamp), durationSeconds, redeemRate);

        // Transfer from BIC to Account
        SafeERC20.safeTransfer(IERC20(erc20), address(ret), totalAmount);

        redeemAddress[beneficiaryAddress] = address(ret);
        emit RedeemInitialized(address(ret), erc20, totalAmount, beneficiaryAddress, durationSeconds, redeemRate);
    }


    /// @notice Computes the address of a potential redeem contract for a given set of parameters
    /// @param erc20 The address of the ERC20 token involved
    /// @param totalAmount The total amount of tokens potentially to lock
    /// @param beneficiaryAddress The address of the potential beneficiary
    /// @param durationSeconds The potential duration of the redeem
    /// @param redeemRate The percentage of total tokens to redeem at each interval
    /// @return predicted The address of the potential redeem contract
    function computeRedeem(
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 redeemRate
    ) public view returns (address) {
        if (redeemAddress[beneficiaryAddress] != address(0)) {
            return redeemAddress[beneficiaryAddress];
        }

        bytes32 salthash = _getHash(erc20, totalAmount, beneficiaryAddress, durationSeconds, redeemRate);

        address predicted = Clones.predictDeterministicAddress(address(bicRedeemImplementation), salthash);

        return predicted;
    }

    /// @notice Computes a hash of the redeem parameters
    /// @dev This hash is used for creating deterministic addresses for clone contracts
    /// @param erc20 The address of the ERC20 token
    /// @param totalAmount The total amount of tokens
    /// @param beneficiaryAddress The address of the beneficiary
    /// @param durationSeconds The duration of the redeem
    /// @param redeemRate The percentage of the total amount to be redeemed per interval
    /// @return hash The computed hash of the parameters
    function _getHash(
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 redeemRate
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(erc20, totalAmount, beneficiaryAddress, durationSeconds, redeemRate));
    }


}
