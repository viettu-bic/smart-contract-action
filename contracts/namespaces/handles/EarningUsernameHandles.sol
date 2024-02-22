// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {OwnershipUsernameHandles} from "../handles/OwnershipUsernameHandles.sol";
import {IBicPermissions} from "../../management/interfaces/IBicPermissions.sol";

contract EarningUsernameHandles is OwnershipUsernameHandles {

    constructor(IBicPermissions _bp) OwnershipUsernameHandles(_bp) {}

    function name() public pure override virtual returns (string memory) {
        return 'Earning BIC Username';
    }

    function symbol() public pure override virtual returns (string memory) {
        return 'eBUN';
    }

    function getNamespace() public pure override virtual returns (string memory) {
        return 'ebun';
    }
}
