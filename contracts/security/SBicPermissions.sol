// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;
import "./IBicPermissions.sol";


abstract contract SBicPermissions is IBicPermissions {
    // Constants
    bytes32 public constant ACCOUNT_RECOVERY_ROLE = keccak256("ACCOUNT_RECOVERY_ROLE");
    bytes32 public constant ACCOUNT_OPERATOR_ROLE = keccak256("ACCOUNT_OPERATOR_ROLE");

    /* Storages */
    // Permissions for AA
    // mapping (address => AccountPermission) private accountPermissions;
    // mapping (address => EnumerableSet.AddressSet) private accountPermissions;
}