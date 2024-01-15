// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;
import "./IBicPermissions.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";


abstract contract SBicPermissions is IBicPermissions {
    using EnumerableSet for EnumerableSet.AddressSet;
    
    // Constants
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");

    /* Storages */
    // Permissions for AA
    // mapping (address => AccountPermission) private accountPermissions;
    // mapping (address => EnumerableSet.AddressSet) private accountPermissions;
}