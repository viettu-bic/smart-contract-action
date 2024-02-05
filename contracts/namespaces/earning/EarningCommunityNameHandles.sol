// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {CommunityNameHandles} from "../CommunityNameHandles.sol";
import {IBicPermissions} from "../../management/interfaces/IBicPermissions.sol";
import {Earning} from "./Earning.sol";

contract EarningCommunityNameHandles is CommunityNameHandles, Earning {

    constructor(IBicPermissions _bp) CommunityNameHandles(_bp) {}

    function name() public pure override virtual returns (string memory) {
        return 'Earning BIC Community Name';
    }

    function symbol() public pure override virtual returns (string memory) {
        return 'eBCN';
    }

    function getNamespace() public pure override virtual returns (string memory) {
        return 'ebcn';
    }

    function setEarningRate(uint32 numerator, uint32 denominator) public override onlyOperator {
        super.setEarningRate(numerator, denominator);
    }
}
