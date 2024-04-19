// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

// Library
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

// Internal
import {BicPermissions} from "../../management/BicPermissions.sol";
import {IHandleTokenURI} from "../interfaces/IHandleTokenURI.sol";

contract HandleTokenURI is IHandleTokenURI {
    /**
     * @notice using strings library for uint256
     */
    using Strings for uint256;

    /**
     * @notice The variable corner
     */
    BicPermissions public immutable permissions;
    struct NameElement {
        string imageDescription;
        string imageURI;
    }
    mapping(string => NameElement) nameElements;

    /**
     * @notice Emitted when a name element is set
     * @param imageDescription the description of the name (aka Beincom - Earning Username)
     * @param imageURI the uri for svg background name image
     */
    event SetNameElement(
        string namespace,
        string imageDescription,
        string imageURI
    );

    /**
     * @param _permissions management
     */
    constructor(BicPermissions _permissions) {
        permissions = _permissions;
    }

    /**
     * @notice permission modifier
     */
    modifier onlyOperator() {
        require(
            permissions.hasRole(permissions.OPERATOR_ROLE(), msg.sender),
            "only operator"
        );
        _;
    }

    /**
     * @notice set the namespace and name element related
     * @param namespace is used to sperate the kind of nft
     */
    function setNameElement(
        string memory namespace,
        string memory imageDescription,
        string memory imageURI
    ) external onlyOperator {
        nameElements[namespace] = NameElement(imageDescription, imageURI);
        emit SetNameElement(namespace, imageDescription, imageURI);
    }

    /**
     * @notice get detail name element based on namespace
     */
    function getNameElement(
        string memory namespace
    ) external view returns (string memory, string memory) {
        return (
            nameElements[namespace].imageDescription,
            nameElements[namespace].imageURI
        );
    }

    /**
     * @notice get image url for metadata
     */
    function getImageURI(
        string memory namespace,
        string memory localName
    ) internal view returns (string memory) {
        return
            string.concat(
                nameElements[namespace].imageURI,
                "?name=",
                localName
            );
    }

    /**
     * @notice get image description for metadata
     */
    function getImageDescription(
        string memory namespace,
        string memory localName
    ) internal view returns (string memory) {
        return
            string.concat(
                '"',
                nameElements[namespace].imageDescription,
                localName,
                '"'
            );
    }

    /**
     * @notice get token URI
     */
    function getTokenURI(
        uint256 tokenId,
        string memory localName,
        string memory namespace
    ) external view override returns (string memory) {
        return
            string.concat(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        string.concat(
                            '{"name":"@',
                            localName,
                            '","description":',
                            getImageDescription(namespace, localName),
                            ',"image":"',
                            getImageURI(namespace, localName),
                            '","attributes":[{"display_type":"number","trait_type":"ID","value":"',
                            tokenId.toString(),
                            '"},{"trait_type":"NAMESPACE","value":"',
                            namespace,
                            '"},{"trait_type":"LENGTH","value":"',
                            bytes(localName).length.toString(),
                            '"}]}'
                        )
                    )
                )
            );
    }
}
