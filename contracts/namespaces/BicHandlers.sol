// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {BaseHandles} from "./BaseHandles.sol";
import {IBicPermissions} from "../management/interfaces/IBicPermissions.sol";

contract BicHandlers is BaseHandles {
    constructor(IBicPermissions _bp) BaseHandles(_bp) {}

    function name() public pure override returns (string memory) {
        return 'BIC Username';
    }

    function symbol() public pure override returns (string memory) {
        return 'BUN';
    }

    function getNamespace() public pure override returns (string memory) {
        return 'bic';
    }
}
