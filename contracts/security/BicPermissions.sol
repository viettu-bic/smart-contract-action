// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "./SBicPermissions.sol";

contract BicPermissions is AccessControlEnumerable, SBicPermissions {
    constructor() {
        // Default Admin, Recovery role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ACCOUNT_RECOVERY_ROLE, msg.sender);
        _setupRole(ACCOUNT_OPERATOR_ROLE, msg.sender);

        // AdminRole of RECOVERY_ROLE, default is DEFAULT_ADMIN_ROLE
        _setRoleAdmin(ACCOUNT_RECOVERY_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(ACCOUNT_OPERATOR_ROLE, DEFAULT_ADMIN_ROLE);
    }
    
    /* Implement more functions */
    
}