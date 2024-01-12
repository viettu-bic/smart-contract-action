// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract BicPermissionsEnumerable is AccessControlEnumerable{
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");

    constructor() {
        // Default Admin
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // AdminRole of RECOVERY_ROLE, default is DEFAULT_ADMIN_ROLE
        _setRoleAdmin(RECOVERY_ROLE, DEFAULT_ADMIN_ROLE);
    }
    
    /* Implement more functions */
}