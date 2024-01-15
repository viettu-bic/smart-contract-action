// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

interface IBicPermissions is IAccessControlEnumerable {
    // struct AccountPermission {
    //     EnumerableSet.AddressSet allSigners;
    //     EnumerableSet.AddressSet allAdmins;
    // }

    // function defaultAccountPermission(address _admin, address _signer) external;
    // function isAdminOf(address _account) external view returns(bool);
}
