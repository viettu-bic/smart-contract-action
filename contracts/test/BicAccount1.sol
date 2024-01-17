// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {BicAccount} from "../smart-wallet/BicAccount.sol";
import {BicPermissions} from "./../management/BicPermissions.sol";

import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

contract BicAccount1 is BicAccount {
    uint256 public version;
    constructor(IEntryPoint anEntryPoint) BicAccount(anEntryPoint) {}

    function initialize(address anOwner, BicPermissions _permissions) public virtual override initializer {
        _initialize(anOwner, _permissions);
        version = 1;
    }

    function info() external pure returns (string memory) {
        return "BicAccount1";
    }
}
