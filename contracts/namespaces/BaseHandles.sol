// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;


import {ERC721} from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import {HandlesEvents} from './constants/HandlesEvents.sol';
import {HandlesErrors} from './constants/HandlesErrors.sol';
import {IHandleTokenURI} from './interfaces/IHandleTokenURI.sol';
import {Address} from '@openzeppelin/contracts/utils/Address.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import {IBaseHandles} from "./interfaces/IBaseHandles.sol";
import {IBicPermissions} from "../management/interfaces/IBicPermissions.sol";

/**
 * A handle is defined as a local name inside a namespace context. A handle is represented as the local name with its
 * namespace applied as a prefix, using the slash symbol as separator.
 *
 *      handle = namespace /@ localName
 *
 * Handle and local name can be used interchangeably once you are in a context of a namespace, as it became redundant.
 *
 *      handle === ${localName} ; inside some namespace.
 *
 * @custom:upgradeable Transparent upgradeable proxy without initializer.
 */
contract BaseHandles is ERC721, IBaseHandles {
    using Address for address;
    address public immutable CONTROLLER;
    IBicPermissions private immutable _bicPermissions;

    // We used 31 to fit the handle in a single slot, with `.name` that restricted localName to use 26 characters.
    // Can be extended later if needed.
    uint256 internal constant MAX_LOCAL_NAME_LENGTH = 26;
    uint256 private _totalSupply;


    mapping(uint256 tokenId => string localName) internal _localNames;

    address internal _handleTokenURIContract;

    modifier onlyOperator() {
        if (!_bicPermissions.hasRole(_bicPermissions.OPERATOR_ROLE(), msg.sender)) {
            revert HandlesErrors.NotOperator();
        }
        _;
    }

    modifier onlyEOA() {
        if (msg.sender.isContract()) {
            revert HandlesErrors.NotEOA();
        }
        _;
    }

    modifier onlyController() {
        if (msg.sender != CONTROLLER) {
            revert HandlesErrors.NotController();
        }
        _;
    }

    constructor(
        IBicPermissions _bp
    ) ERC721('', '') {
    _bicPermissions = _bp;
    }

    function name() public pure virtual override returns (string memory) {
        return 'Bic Basename';
    }

    function symbol() public pure virtual override returns (string memory) {
        return 'BBN';
    }

    function totalSupply() external view virtual override returns (uint256) {
        return _totalSupply;
    }

    function setHandleTokenURIContract(address handleTokenURIContract) external override onlyOperator {
        _handleTokenURIContract = handleTokenURIContract;
        emit HandlesEvents.BatchMetadataUpdate({fromTokenId: 0, toTokenId: type(uint256).max});
    }

    function getHandleTokenURIContract() external view override returns (address) {
        return _handleTokenURIContract;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        return IHandleTokenURI(_handleTokenURIContract).getTokenURI(tokenId, _localNames[tokenId], getNamespace());
    }

    function mintHandle(
        address to,
        string calldata localName
    ) external onlyOperator returns (uint256) {
        _validateLocalName(localName);
        return _mintHandle(to, localName);
    }

    function migrateHandle(address to, string calldata localName) external onlyController returns (uint256) {
        _validateLocalNameMigration(localName);
        return _mintHandle(to, localName);
    }

    function burn(uint256 tokenId) external {
        if (msg.sender != ownerOf(tokenId)) {
            revert HandlesErrors.NotOwner();
        }
        --_totalSupply;
        _burn(tokenId);
        delete _localNames[tokenId];
    }

    function exists(uint256 tokenId) external view override returns (bool) {
        return _exists(tokenId);
    }

    function getNamespace() public pure virtual returns (string memory) {
        return 'name';
    }

    function getNamespaceHash() external pure returns (bytes32) {
        return keccak256(bytes(getNamespace()));
    }

    function getLocalName(uint256 tokenId) public view returns (string memory) {
        string memory localName = _localNames[tokenId];
        if (bytes(localName).length == 0) {
            revert HandlesErrors.DoesNotExist();
        }
        return _localNames[tokenId];
    }

    function getHandle(uint256 tokenId) public view returns (string memory) {
        string memory localName = getLocalName(tokenId);
        return string.concat(getNamespace(), '/@', localName);
    }

    function getTokenId(string memory localName) public pure returns (uint256) {
        return uint256(keccak256(bytes(localName)));
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, IERC165) returns (bool) {
        return (ERC721.supportsInterface(interfaceId));
    }

    //////////////////////////////////////
    ///        INTERNAL FUNCTIONS      ///
    //////////////////////////////////////

    function _mintHandle(address to, string calldata localName) internal returns (uint256) {
        uint256 tokenId = getTokenId(localName);
        ++_totalSupply;
        _mint(to, tokenId);
        _localNames[tokenId] = localName;
        emit HandlesEvents.HandleMinted(localName, getNamespace(), tokenId, to, block.timestamp);
        return tokenId;
    }

    /// @dev This function is used to validate the local name when migrating from V1 to V2.
    ///      As in V1 we also allowed the Hyphen '-' character, we need to allow it here as well and use a separate
    ///      validation function for migration VS newly created handles.
    function _validateLocalNameMigration(string memory localName) internal pure {
        bytes memory localNameAsBytes = bytes(localName);
        uint256 localNameLength = localNameAsBytes.length;

        if (localNameLength == 0 || localNameLength > MAX_LOCAL_NAME_LENGTH) {
            revert HandlesErrors.HandleLengthInvalid();
        }

        bytes1 firstByte = localNameAsBytes[0];
        if (firstByte == '-' || firstByte == '_') {
            revert HandlesErrors.HandleFirstCharInvalid();
        }

        uint256 i;
        while (i < localNameLength) {
            if (!_isAlphaNumeric(localNameAsBytes[i]) && localNameAsBytes[i] != '-' && localNameAsBytes[i] != '_') {
                revert HandlesErrors.HandleContainsInvalidCharacters();
            }
            unchecked {
                ++i;
            }
        }
    }

    /// @dev In V2 we only accept the following characters: [a-z0-9_] to be used in newly created handles.
    ///      We also disallow the first character to be an underscore '_'.
    function _validateLocalName(string memory localName) internal pure {
        bytes memory localNameAsBytes = bytes(localName);
        uint256 localNameLength = localNameAsBytes.length;

        if (localNameLength == 0 || localNameLength > MAX_LOCAL_NAME_LENGTH) {
            revert HandlesErrors.HandleLengthInvalid();
        }

        if (localNameAsBytes[0] == '_') {
            revert HandlesErrors.HandleFirstCharInvalid();
        }

        uint256 i;
        while (i < localNameLength) {
            if (!_isAlphaNumeric(localNameAsBytes[i]) && localNameAsBytes[i] != '_') {
                revert HandlesErrors.HandleContainsInvalidCharacters();
            }
            unchecked {
                ++i;
            }
        }
    }

    /// @dev We only accept lowercase characters to avoid confusion.
    /// @param char The character to check.
    /// @return True if the character is alphanumeric, false otherwise.
    function _isAlphaNumeric(bytes1 char) internal pure returns (bool) {
        return (char >= '0' && char <= '9') || (char >= 'a' && char <= 'z');
    }

}

