// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract BicPermissions is AccessControlEnumerable {
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    constructor() {
        // Default Admin, Recovery role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(RECOVERY_ROLE, msg.sender);
        _setupRole(OPERATOR_ROLE, msg.sender);
    }

    /* Implement more functions */

}
