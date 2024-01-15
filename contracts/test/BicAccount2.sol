// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {BicAccount} from "../smart-wallet/BicAccount.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

contract BicAccount2 is BicAccount {
    uint256 public version;
    constructor(IEntryPoint anEntryPoint) BicAccount(anEntryPoint) {}

    function initialize(address anOwner) public virtual override initializer {
        _initialize(anOwner);
        version = 2;
    }

    function info() external pure returns (string memory) {
        return "BicAccount2";
    }
}
