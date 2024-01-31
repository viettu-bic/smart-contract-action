// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {UsernameHandlers} from "../UsernameHandlers.sol";
import {IBicPermissions} from "../../management/interfaces/IBicPermissions.sol";
import {Earning} from "./Earning.sol";

contract EarningUsernameHandlers is UsernameHandlers, Earning {

    constructor(IBicPermissions _bp) UsernameHandlers(_bp) {}

    function name() public pure override virtual returns (string memory) {
        return 'Earning BIC Username';
    }

    function symbol() public pure override virtual returns (string memory) {
        return 'eBUN';
    }

    function getNamespace() public pure override virtual returns (string memory) {
        return 'ebic';
    }

    function setEarningRate(uint32 numerator, uint32 denominator) public override onlyOperator {
        super.setEarningRate(numerator, denominator);
    }
}
