import {ethers} from "hardhat";
import {parseEther, Wallet} from "ethers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import {expect} from "chai";
import {deploy} from "@openzeppelin/hardhat-upgrades/dist/utils";
import { defaultAbiCoder } from '@ethersproject/abi';
import {EntryPoint} from "../../../typechain-types";

describe.skip('VerifyingTokenPayAfterPaymaster', () => {
    const {provider} = ethers;

    let admin, beneficiary;
    let entryPoint;
    let entryPointAddress;
    let bicAccountFactory;
    let bicAccountFactoryAddress;
    let bicTokenPaymaster;
    let bicAccountInterface = new ethers.Interface([
        "function execute(address target, uint256 value, bytes data)",
        "function executeBatch(address[] targets, uint256[] values, bytes[] datas)"
    ]);
    let legacyTokenPaymasterAddress;
    let verifyingTokenPayAfterPaymaster;
    let verifyingTokenPayAfterPaymasterAddress;
    let tree;

    let simpleClaim;
    let user1: Wallet = new ethers.Wallet("0x0000000000000000000000000000000000000000000000000000000000000001", provider)
    let user2: Wallet = new ethers.Wallet("0x0000000000000000000000000000000000000000000000000000000000000002", provider)
    let smartWalletUser1Address;
    let smartWalletUser2Address;
    let verifierWallet = ethers.Wallet.createRandom();

    beforeEach(async () => {
        beneficiary = ethers.Wallet.createRandom().address;
        [admin] = await ethers.getSigners();
        const EntryPoint = await ethers.getContractFactory("EntryPointTest");
        entryPoint = await EntryPoint.deploy();
        await entryPoint.waitForDeployment();
        entryPointAddress = await entryPoint.getAddress();

        const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");
        await bicAccountFactory.waitForDeployment();
        bicAccountFactoryAddress = await bicAccountFactory.getAddress();

        const BicTokenPaymaster = await ethers.getContractFactory("BicTokenPaymaster");
        bicTokenPaymaster = await BicTokenPaymaster.deploy(bicAccountFactoryAddress, entryPointAddress);
        await bicTokenPaymaster.waitForDeployment();
        legacyTokenPaymasterAddress = await bicTokenPaymaster.getAddress();

        smartWalletUser1Address = await bicAccountFactory.getFunction("getAddress")(user1.address as any, 0n as any);
        smartWalletUser2Address = await bicAccountFactory.getFunction("getAddress")(user2.address as any, 0n as any);
        const values = [
            [0, admin.address.toLowerCase(), ethers.parseEther('100')],
            [1, smartWalletUser1Address.toLowerCase(), ethers.parseEther('100')],
            [2, smartWalletUser2Address.toLowerCase(), ethers.parseEther('200')],
        ]
        // const hashedLeafs = [
        //     ethers.solidityPackedKeccak256(["uint256", "address", "uint256"], [0, user1.address, 100]),
        //     ethers.solidityPackedKeccak256(["uint256", "address", "uint256"], [1, user2.address, 200]),
        // ]
        tree = StandardMerkleTree.of(values, ["uint256", "address", "uint256"])
        const SimpleClaim = await ethers.getContractFactory('SimpleClaim');
        simpleClaim = await SimpleClaim.deploy(tree.root, legacyTokenPaymasterAddress);
        await bicTokenPaymaster.mint(simpleClaim.target, parseEther('1000'));
        expect(await bicTokenPaymaster.balanceOf(simpleClaim.target)).to.equal(parseEther('1000'));
        await simpleClaim.waitForDeployment();
        const VerifyingTokenPayAfterPaymaster = await ethers.getContractFactory('VerifyingTokenPayAfterPaymaster');
        verifyingTokenPayAfterPaymaster = await VerifyingTokenPayAfterPaymaster.deploy(entryPointAddress, verifierWallet.address);
        await verifyingTokenPayAfterPaymaster.waitForDeployment();
        verifyingTokenPayAfterPaymasterAddress = await verifyingTokenPayAfterPaymaster.getAddress();
        const TestOracle = await ethers.getContractFactory("TestOracle");
        const testOracle = await TestOracle.deploy();
        await testOracle.waitForDeployment();
        const testOracleAddress = await testOracle.getAddress();
        await verifyingTokenPayAfterPaymaster.setOracle(legacyTokenPaymasterAddress, testOracleAddress);
        await entryPoint.depositTo(verifyingTokenPayAfterPaymaster as any, { value: parseEther('1') } as any)
    });


    it('user 1 with zero native token can claim', async () => {
        // native token balance of user 1
        expect(await provider.getBalance(smartWalletUser1Address)).to.equal(0);

        const createAccountCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [user1.address as any, ethers.ZeroHash]);
        const target = bicAccountFactoryAddress;
        const value = ethers.ZeroHash;
        const initCode = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), createAccountCallData]
        );

        const validAfter = (await ethers.provider.getBlock('latest'))?.timestamp;
        const validUntil = validAfter + 60*60;
        const validTimeEncoded = defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]);
        const approveCallData = bicTokenPaymaster.interface.encodeFunctionData("approve", [verifyingTokenPayAfterPaymasterAddress, ethers.parseEther('100')]);
        const claimCalldata = simpleClaim.interface.encodeFunctionData("claim", [tree.getProof(1), smartWalletUser1Address, 1, ethers.parseEther('100')]);
        const callDataForEntrypoint = bicAccountInterface.encodeFunctionData("executeBatch", [[bicTokenPaymaster.target, simpleClaim.target], [value, value], [approveCallData, claimCalldata]]);

        const op = {
            sender: smartWalletUser1Address,
            nonce: 0,
            initCode: initCode,
            callData: callDataForEntrypoint,
            callGasLimit: 5_000_000,
            verificationGasLimit: 5_000_000,
            preVerificationGas: 5_000_000,
            maxFeePerGas: 112,
            maxPriorityFeePerGas: 82,
            paymasterAndData: verifyingTokenPayAfterPaymasterAddress + legacyTokenPaymasterAddress.slice(2) + validTimeEncoded.slice(2) + '00'.repeat(64),
            signature: "0x"
        }


        const signPaymasterHash = await verifyingTokenPayAfterPaymaster.getHash(op as any, legacyTokenPaymasterAddress, validUntil as any, validAfter as any);
        const signaturePaymaster = await verifierWallet.signMessage(ethers.getBytes(signPaymasterHash));
        op.paymasterAndData = ethers.concat([verifyingTokenPayAfterPaymasterAddress, legacyTokenPaymasterAddress, validTimeEncoded, signaturePaymaster]);

        const opHash = await entryPoint.getUserOpHash(op as any);
        const signature = await user1.signMessage(ethers.getBytes(opHash));
        op.signature = ethers.solidityPacked(["bytes"], [signature]);

        // await expect(entryPoint.handleOps([op] as any, admin.address)).to.be.revertedWithCustomError(entryPoint,'SignatureValidationFailed');
        const tx = await entryPoint.handleOps([op] as any, admin.address);
        // console.log('tx: ', tx);

        console.log('bic balance: ', (await bicTokenPaymaster.balanceOf(smartWalletUser1Address)).toString());
    });

    it('user 2 can get bic from uniswap then pay fee latter', async () => {
       const TestUniswap = await ethers.getContractFactory("TestUniswap");
       const testUniswap = await TestUniswap.deploy();
       await testUniswap.waitForDeployment();

       const TestERC20 = await ethers.getContractFactory("TestERC20")
        const usdt = await TestERC20.deploy();
        await usdt.waitForDeployment();
        expect(await provider.getBalance(smartWalletUser2Address)).to.equal(0);
        expect(await usdt.balanceOf(smartWalletUser2Address)).to.equal(0);
        expect(await bicTokenPaymaster.balanceOf(smartWalletUser2Address)).to.equal(0);
        await usdt.transfer(smartWalletUser2Address, parseEther('1000') as any);
        expect(await usdt.balanceOf(smartWalletUser2Address)).to.equal(parseEther('1000'));
        await bicTokenPaymaster.mint(testUniswap.target, parseEther('10000'));
        const swapParams = {
            tokenIn: usdt.target,
            tokenOut: legacyTokenPaymasterAddress,
            fee: 3000,
            recipient: smartWalletUser2Address,
            deadline: Math.floor(Date.now() / 1000) + 60 * 20,
            amountIn: parseEther('100'),
            amountOutMinimum: parseEther('1470'), // bic at price 0.068 usdt
            sqrtPriceLimitX96: 0
        }
        const swapCallData = testUniswap.interface.encodeFunctionData("exactInputSingle", [swapParams]);
        const validAfter = (await ethers.provider.getBlock('latest'))?.timestamp;
        const validUntil = validAfter + 60*60;
        const validTimeEncoded = defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]);
        const approveUsdtCallData = usdt.interface.encodeFunctionData("approve", [testUniswap.target, parseEther('100')]);
        const approveBicCallData = bicTokenPaymaster.interface.encodeFunctionData("approve", [verifyingTokenPayAfterPaymasterAddress, parseEther('100')]);
        const callDataForEntrypoint = bicAccountInterface.encodeFunctionData("executeBatch", [[usdt.target, bicTokenPaymaster.target, testUniswap.target], [0, 0, 0], [approveUsdtCallData, approveBicCallData, swapCallData]]);
        const initCode = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), bicAccountFactory.interface.encodeFunctionData("createAccount", [user2.address as any, ethers.ZeroHash])]
        );
        const op = {
            sender: smartWalletUser2Address,
            nonce: 0,
            initCode: initCode,
            callData: callDataForEntrypoint,
            callGasLimit: 5_000_000,
            verificationGasLimit: 5_000_000,
            preVerificationGas: 5_000_000,
            maxFeePerGas: 112,
            maxPriorityFeePerGas: 82,
            paymasterAndData: verifyingTokenPayAfterPaymasterAddress + legacyTokenPaymasterAddress.slice(2) + validTimeEncoded.slice(2) + '00'.repeat(64),
            signature: "0x"
        }

        const signPaymasterHash = await verifyingTokenPayAfterPaymaster.getHash(op as any, legacyTokenPaymasterAddress, validUntil as any, validAfter as any);
        const signaturePaymaster = await verifierWallet.signMessage(ethers.getBytes(signPaymasterHash));
        op.paymasterAndData = ethers.concat([verifyingTokenPayAfterPaymasterAddress, legacyTokenPaymasterAddress, validTimeEncoded, signaturePaymaster]);
        const opHash = await entryPoint.getUserOpHash(op as any);
        const signature = await user2.signMessage(ethers.getBytes(opHash));
        op.signature = ethers.solidityPacked(["bytes"], [signature]);
        const tx = await entryPoint.handleOps([op] as any, admin.address);
        console.log('bic balance: ', (await bicTokenPaymaster.balanceOf(smartWalletUser2Address)).toString());
    });

    it('withdrawTokensTo', async () => {
        await bicTokenPaymaster.mint(verifyingTokenPayAfterPaymasterAddress, parseEther('1000'));
        await verifyingTokenPayAfterPaymaster.withdrawTokensTo(bicTokenPaymaster.target, beneficiary, parseEther('1000'));
        expect(await bicTokenPaymaster.balanceOf(beneficiary)).to.equal(parseEther('1000'));
    })

    it('revert when wrong signarue', async () => {
        const createAccountCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [user1.address as any, ethers.ZeroHash]);
        const target = bicAccountFactoryAddress;
        const value = ethers.ZeroHash;
        const initCode = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), createAccountCallData]
        );

        const validAfter = (await ethers.provider.getBlock('latest'))?.timestamp;
        const validUntil = validAfter + 60*60;
        const validTimeEncoded = defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]);
        const approveCallData = bicTokenPaymaster.interface.encodeFunctionData("approve", [verifyingTokenPayAfterPaymasterAddress, ethers.parseEther('100')]);
        const claimCalldata = simpleClaim.interface.encodeFunctionData("claim", [tree.getProof(1), smartWalletUser1Address, 1, ethers.parseEther('100')]);
        const callDataForEntrypoint = bicAccountInterface.encodeFunctionData("executeBatch", [[bicTokenPaymaster.target, simpleClaim.target], [value, value], [approveCallData, claimCalldata]]);

        const op = {
            sender: smartWalletUser1Address,
            nonce: 0,
            initCode: initCode,
            callData: callDataForEntrypoint,
            callGasLimit: 5_000_000,
            verificationGasLimit: 5_000_000,
            preVerificationGas: 5_000_000,
            maxFeePerGas: 112,
            maxPriorityFeePerGas: 82,
            paymasterAndData: verifyingTokenPayAfterPaymasterAddress + legacyTokenPaymasterAddress.slice(2) + validTimeEncoded.slice(2) + '00'.repeat(64),
            signature: "0x"
        }

        await expect(entryPoint.handleOps([op] as any, admin.address)).to.be.revertedWithCustomError(entryPoint,'FailedOp');

    });

});
