//// SPDX-License-Identifier: GPL-3.0
//pragma solidity ^0.8.23;
//
//import {BaseHandles} from "./BaseHandles.sol";
//import {IBicPermissions} from "../../management/interfaces/IBicPermissions.sol";
//import {HandlesErrors} from '../constants/HandlesErrors.sol';
//
//contract CommunityNameHandles is BaseHandles {
//    uint256 internal constant MIN_LOCAL_NAME_LENGTH = 3;
//    uint256 internal constant MAX_LOCAL_NAME_LENGTH = 128;
//
//    constructor(IBicPermissions _bp) BaseHandles(_bp) {}
//
//    function name() public pure override virtual returns (string memory) {
//        return 'Ownership BIC community name';
//    }
//
//    function symbol() public pure override virtual returns (string memory) {
//        return 'oBCN';
//    }
//
//    function getNamespace() public pure override virtual returns (string memory) {
//        return 'obcn';
//    }
//
//    function _validateLocalName(string memory localName) internal virtual override pure {
//        bytes memory localNameAsBytes = bytes(localName);
//        uint256 localNameLength = localNameAsBytes.length;
//
//        if (localNameLength == 0 || localNameLength > MAX_LOCAL_NAME_LENGTH || localNameLength < MIN_LOCAL_NAME_LENGTH) {
//            revert HandlesErrors.HandleLengthInvalid();
//        }
//    }
//}
