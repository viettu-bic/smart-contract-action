// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {BaseHandles} from "./BaseHandles.sol";
import {IBicPermissions} from "../management/interfaces/IBicPermissions.sol";

contract CommHandlers is BaseHandles {
    constructor(IBicPermissions _bp) BaseHandles(_bp) {}

    function name() public pure override returns (string memory) {
        return 'BIC community name';
    }

    function symbol() public pure override returns (string memory) {
        return 'BCN';
    }

    function getNamespace() public pure override returns (string memory) {
        return 'comm';
    }
}
