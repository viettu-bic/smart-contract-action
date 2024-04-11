// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

library HandlesErrors {
    error HandleLengthInvalid();
    error HandleContainsInvalidCharacters();
    error HandleFirstCharInvalid();
    error NotOwner();
    error NotController();
    error DoesNotExist();
    error NotEOA();
    error DisablingAlreadyTriggered();
    error AlreadyEnabled();
    error NotOperator();
    error NotImplemented();
}
