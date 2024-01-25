// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';


interface IBaseHandles is IERC721 {

    function mintHandle(address to, string calldata localName) external returns (uint256);

    function burn(uint256 tokenId) external;

    function getNamespace() external pure returns (string memory);

    function getNamespaceHash() external pure returns (bytes32);

    function exists(uint256 tokenId) external view returns (bool);

    function totalSupply() external view returns (uint256);

    function getHandleTokenURIContract() external view returns (address);

    function setHandleTokenURIContract(address handleTokenURIContract) external;
}
