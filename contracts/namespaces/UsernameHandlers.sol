// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {BaseHandles} from "./BaseHandles.sol";
import {IBicPermissions} from "../management/interfaces/IBicPermissions.sol";
import {HandlesErrors} from './constants/HandlesErrors.sol';

contract UsernameHandlers is BaseHandles {
    uint256 internal constant MAX_LOCAL_NAME_LENGTH = 50;

    constructor(IBicPermissions _bp) BaseHandles(_bp) {}

    function name() public pure override virtual returns (string memory) {
        return 'Onwership BIC Username';
    }

    function symbol() public pure override virtual returns (string memory) {
        return 'oBUN';
    }

    function getNamespace() public pure override virtual returns (string memory) {
        return 'obun';
    }

    function _validateLocalName(string memory localName) internal virtual override pure {
        bytes memory localNameAsBytes = bytes(localName);
        uint256 localNameLength = localNameAsBytes.length;

        if (localNameLength == 0 || localNameLength > MAX_LOCAL_NAME_LENGTH) {
            revert HandlesErrors.HandleLengthInvalid();
        }

        uint256 i;
        while (i < localNameLength) {
            if (!_isAlphaNumeric(localNameAsBytes[i]) && localNameAsBytes[i] != '.') {
                revert HandlesErrors.HandleContainsInvalidCharacters();
            }
            unchecked {
                ++i;
            }
        }
    }

    /// @dev We only accept lowercase characters to avoid confusion.
    /// @param char The character to check.
    /// @return True if the character is alphanumeric, false otherwise.
    function _isAlphaNumeric(bytes1 char) internal pure returns (bool) {
        return (char >= '0' && char <= '9') || (char >= 'a' && char <= 'z');
    }
}
