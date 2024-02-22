// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {OwnershipCommunityNameHandles} from "../handles/OwnershipCommunityNameHandles.sol";
import {IBicPermissions} from "../../management/interfaces/IBicPermissions.sol";

contract EarningCommunityNameHandles is OwnershipCommunityNameHandles {

    constructor(IBicPermissions _bp) OwnershipCommunityNameHandles(_bp) {}

    function name() public pure override virtual returns (string memory) {
        return 'Earning BIC Community Name';
    }

    function symbol() public pure override virtual returns (string memory) {
        return 'eBCN';
    }

    function getNamespace() public pure override virtual returns (string memory) {
        return 'ebcn';
    }
}
