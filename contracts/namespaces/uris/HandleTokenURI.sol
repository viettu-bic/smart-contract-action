// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IHandleTokenURI} from "../interfaces/IHandleTokenURI.sol";

contract HandleTokenURI is IHandleTokenURI {
    using Strings for uint256;

    string imageBaseURI;
    string constant ouNFT = "Ownership Username";
    string constant ocNFT = "Ownership Community Name";
    string constant euNFT = "Earning Username";
    string constant ecNFT = "Earning Community Name";

    struct Name {
        string imageBaseURI;
        string imageDescription;
    }
    mapping(string => Name) names;

    constructor(string memory _imageBaseURI) {
        imageBaseURI = _imageBaseURI;

        Name memory ownershipUsername = Name(
            string.concat(imageBaseURI, "/ounft/"),
            string.concat('"Beincom - ', ouNFT, "@")
        );
        Name memory ownershipCommunityName = Name(
            string.concat(imageBaseURI, "/ocnft/"),
            string.concat('"Beincom - ', ocNFT, "@")
        );
        Name memory earningUsername = Name(
            string.concat(imageBaseURI, "/eunft/"),
            string.concat('"Beincom - ', euNFT, "@")
        );
        Name memory earningCommunityName = Name(
            string.concat(imageBaseURI, "/ecnft/"),
            string.concat('"Beincom - ', ecNFT, "@")
        );

        names[ouNFT] = ownershipUsername;
        names[ocNFT] = ownershipCommunityName;
        names[euNFT] = earningUsername;
        names[ecNFT] = earningCommunityName;
    }

    modifier onlyValidNamespace(string memory namespace) {
        require(
            bytes(names[namespace].imageBaseURI).length > 0 &&
                bytes(names[namespace].imageDescription).length > 0,
            "namespace not valid"
        );
        _;
    }

    /**
     * @notice get image url for metadata
     */
    function getImageBaseURI(
        string memory namespace,
        string memory localName
    ) internal view onlyValidNamespace(namespace) returns (string memory) {
        return string.concat(names[namespace].imageBaseURI, localName, ".svg");
    }

    /**
     * @notice get image description for metadata
     */
    function getImageDescription(
        string memory namespace,
        string memory localName
    ) internal view onlyValidNamespace(namespace) returns (string memory) {
        return string.concat(names[namespace].imageDescription, localName, '"');
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
                            getImageBaseURI(namespace, localName),
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
