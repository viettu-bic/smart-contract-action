// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {UsernameHandles} from "../UsernameHandles.sol";
import {IBicPermissions} from "../../management/interfaces/IBicPermissions.sol";
import {Earning} from "./Earning.sol";

contract EarningUsernameHandles is UsernameHandles, Earning {

    constructor(IBicPermissions _bp) UsernameHandles(_bp) {}

    function name() public pure override virtual returns (string memory) {
        return 'Earning BIC Username';
    }

    function symbol() public pure override virtual returns (string memory) {
        return 'eBUN';
    }

    function getNamespace() public pure override virtual returns (string memory) {
        return 'ebun';
    }

    function setEarningRate(uint32 numerator, uint32 denominator) public override onlyOperator {
        super.setEarningRate(numerator, denominator);
    }
}
