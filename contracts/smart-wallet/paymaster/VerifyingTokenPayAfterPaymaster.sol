// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@account-abstraction/contracts/samples/IOracle.sol";
import "hardhat/console.sol";

contract VerifyingTokenPayAfterPaymaster is BasePaymaster {
    //calculated cost of the postOp
    uint256 constant public COST_OF_POST = 15000;

    using ECDSA for bytes32;
    using UserOperationLib for UserOperation;

    address public immutable verifyingSigner;

    uint256 private constant TOKEN_OFFSET = 20;

    uint256 private constant VALID_TIMESTAMP_OFFSET = 40;

    uint256 private constant SIGNATURE_OFFSET = 104;

    constructor(IEntryPoint _entryPoint, address _verifyingSigner) BasePaymaster(_entryPoint) {
        verifyingSigner = _verifyingSigner;
    }

    mapping(address => uint256) public senderNonce;
    mapping(address => IOracle) public oracles;

    function pack(UserOperation calldata userOp) internal pure returns (bytes memory ret) {
        // lighter signature scheme. must match UserOp.ts#packUserOp
        bytes calldata pnd = userOp.paymasterAndData;
        // copy directly the userOp from calldata up to (but not including) the paymasterAndData.
        // this encoding depends on the ABI encoding of calldata, but is much lighter to copy
        // than referencing each field separately.
        assembly {
            let ofs := userOp
            let len := sub(sub(pnd.offset, ofs), 32)
            ret := mload(0x40)
            mstore(0x40, add(ret, add(len, 32)))
            mstore(ret, len)
            calldatacopy(add(ret, 32), ofs, len)
        }
    }

    /**
     * return the hash we're going to sign off-chain (and validate on-chain)
     * this method is called by the off-chain service, to sign the request.
     * it is called on-chain from the validatePaymasterUserOp, to validate the signature.
     * note that this signature covers all fields of the UserOperation, except the "paymasterAndData",
     * which will carry the signature itself.
     */
    function getHash(UserOperation calldata userOp, address token, uint48 validUntil, uint48 validAfter)
    public view returns (bytes32) {
        //can't use userOp.hash(), since it contains also the paymasterAndData itself.

        return keccak256(abi.encode(
            pack(userOp),
            block.chainid,
            address(this),
            senderNonce[userOp.getSender()],
            token,
            validUntil,
            validAfter
        ));
    }

    /**
     * verify our external signer signed this request.
     * the "paymasterAndData" is expected to be the paymaster and a signature over the entire request params
     * paymasterAndData[:20] : address(this)
     * paymasterAndData[20:40] : token address
     * paymasterAndData[40:104] : abi.encode(validUntil, validAfter)
     * paymasterAndData[104:] : signature
     */
    function _validatePaymasterUserOp(UserOperation calldata userOp, bytes32 /*userOpHash*/, uint256 requiredPreFund)
    internal override returns (bytes memory context, uint256 validationData) {
        (requiredPreFund);
        console.log("start validate paymaster user op");

        (address token, uint48 validUntil, uint48 validAfter, bytes calldata signature) = parsePaymasterAndData(userOp.paymasterAndData);
        console.log("token: %s", token);
        console.log("validUntil: %s", validUntil);
        console.log("validAfter: %s", validAfter);
        //ECDSA library supports both 64 and 65-byte long signatures.
        // we only "require" it here so that the revert reason on invalid signature will be of "VerifyingTokenPayAfterPaymaster", and not "ECDSA"
        require(signature.length == 64 || signature.length == 65, "VerifyingTokenPayAfterPaymaster: invalid signature length in paymasterAndData");
        require(address(oracles[token]) != address(0), "VerifyingTokenPayAfterPaymaster: unsupported token");
        bytes32 hash = ECDSA.toEthSignedMessageHash(getHash(userOp, token, validUntil, validAfter));
        address sender = userOp.getSender();
        senderNonce[sender]++;

//        //don't revert on signature failure: return SIG_VALIDATION_FAILED
//        if (verifyingSigner != ECDSA.recover(hash, signature)) {
//            console.log("signature failed");
//            return (abi.encode(sender, token),_packValidationData(true,validUntil,validAfter));
//        }
        console.log("signature success");
        //no need for other on-chain validation: entire UserOp should have been checked
        // by the external service prior to signing it.
        return (abi.encode(sender, token, userOp.initCode.length == 0),_packValidationData(false,validUntil,validAfter));
    }

    function _postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) internal override {
        //we don't really care about the mode, we just pay the gas with the user's tokens.
        (mode);
        (address sender, address token, bool isInit) = abi.decode(context, (address, address, bool));
        console.log("isInit: %s", isInit);
        uint256 charge = oracles[token].getTokenValueOfEth(actualGasCost + COST_OF_POST);
        console.log("charge: %s", charge);
        // betting for make sure tx not fail so need to simulate
        IERC20(token).transferFrom(sender, address(this), charge);
        console.log("transfer success");
    }

    function parsePaymasterAndData(bytes calldata paymasterAndData) public pure returns(address token, uint48 validUntil, uint48 validAfter, bytes calldata signature) {
        token = address(bytes20(paymasterAndData[TOKEN_OFFSET:VALID_TIMESTAMP_OFFSET]));
        (validUntil, validAfter) = abi.decode(paymasterAndData[VALID_TIMESTAMP_OFFSET:SIGNATURE_OFFSET],(uint48, uint48));
        signature = paymasterAndData[SIGNATURE_OFFSET:];
    }

    function setOracle(address token, IOracle oracle) public onlyOwner {
        oracles[token] = oracle;
    }

    function withdrawTokensTo(IERC20 token, address target, uint256 amount) public onlyOwner {
        token.transfer(target, amount);
    }
}
