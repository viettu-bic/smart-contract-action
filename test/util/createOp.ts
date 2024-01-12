import {BigNumberish, Wallet} from "ethers";
import {ethers} from "hardhat";
import {BicAccount, EntryPoint} from "../../typechain-types";


function packAccountGasLimits (validationGasLimit: BigNumberish, callGasLimit: BigNumberish): string {
    return ethers.concat([
        ethers.zeroPadValue(ethers.toBeHex(validationGasLimit), 16), ethers.zeroPadValue(ethers.toBeHex(callGasLimit), 16)
    ])
}

function packPaymasterData (paymaster: string, paymasterVerificationGasLimit: BigNumberish, postOpGasLimit: BigNumberish, paymasterData: string): string {
    return ethers.concat([
        paymaster, ethers.zeroPadValue(ethers.toBeHex(paymasterVerificationGasLimit), 16),
        ethers.zeroPadValue(ethers.toBeHex(postOpGasLimit), 16), paymasterData
    ])
}

export async function createOp(smartWalletAddress: string, target: string, initCode: string,  initCallData: string, paymasterAddress: string = "0x", chainNonce: BigInt = 0n, user: Wallet, entryPoint: EntryPoint): Promise<any> {
    const smartWallet: BicAccount = await ethers.getContractAt("BicAccount", smartWalletAddress);
    const value = ethers.ZeroHash;
    const callDataForEntrypoint = smartWallet.interface.encodeFunctionData("execute", [target, value, initCallData]);
    const nonce = await entryPoint.getNonce(smartWalletAddress as any, 0 as any);
    const op = {
        sender: smartWalletAddress,
        nonce: nonce + chainNonce,
        initCode: initCode,
        callData: callDataForEntrypoint,
        accountGasLimits: packAccountGasLimits(5_000_000, 5_000_000),
        verificationGasLimit: 5_000_000,
        preVerificationGas: 5_000_000,
        // maxFeePerGas: 0,
        // maxFeePerGas: paymasterAndData === '0x'? 0 : 112,
        maxFeePerGas: 112,
        // maxPriorityFeePerGas: 0,
        maxPriorityFeePerGas: 82,
        paymasterAndData: paymasterAddress === '0x' ? '0x' : packPaymasterData(paymasterAddress, 5_000_000, 5_000_000, '0x'),
        signature: "0x"
    }
    const opHash = await entryPoint.getUserOpHash(op as any);
    const signature = await user.signMessage(ethers.getBytes(opHash));
    op.signature = ethers.solidityPacked(["bytes"], [signature]);
    return op;
}
