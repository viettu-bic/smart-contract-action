// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "./SBicPermissions.sol";

contract BicPermissions is AccessControlEnumerable, SBicPermissions {
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping (address => EnumerableSet.AddressSet) private accountPermissions;
    constructor() {
        // Default Admin, Recovery role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(RECOVERY_ROLE, msg.sender);

        // AdminRole of RECOVERY_ROLE, default is DEFAULT_ADMIN_ROLE
        _setRoleAdmin(RECOVERY_ROLE, DEFAULT_ADMIN_ROLE);
    }
    
    /* Implement more functions */
    // function defaultAccountPermission(address _account, address _admin) external override { 
    //     EnumerableSet.AddressSet storage _accountPermission = accountPermissions[_account];
    //     if(_accountPermission.contains(_admin)) {
    //         revert();
    //     }
    //     _accountPermission.add(_admin);
    // }

    // function isAdminOf(address _account) external view override returns(bool) { 
    //     EnumerableSet.AddressSet storage _accountPermission = accountPermissions[_account];
    //     return _accountPermission.contains(_account);
    // }
}