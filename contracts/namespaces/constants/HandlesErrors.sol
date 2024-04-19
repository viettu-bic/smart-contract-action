// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.23;

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
