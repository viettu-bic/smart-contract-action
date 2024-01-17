// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import { BicAccount } from "../smart-wallet/BicAccount.sol";
import { IEntryPoint } from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

import "./../management/BicPermissions.sol";

contract BicAccount1 is BicAccount {
    // This is make sure the BicAccount constructor is call when deploy
    constructor(IEntryPoint anEntryPoint) BicAccount(anEntryPoint) {}

    function version() external pure override returns (uint256) {
        return 2;
    }
}
