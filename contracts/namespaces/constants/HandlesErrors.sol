// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.23;

library HandlesErrors {
    error NotOwner();
    error NotOperator();
    error NotController();
    error DoesNotExist();
}
