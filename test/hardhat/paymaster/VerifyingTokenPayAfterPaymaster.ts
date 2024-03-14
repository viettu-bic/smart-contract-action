import {ethers} from "hardhat";
import {parseEther, Wallet} from "ethers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import {expect} from "chai";
import {deploy} from "@openzeppelin/hardhat-upgrades/dist/utils";
import { defaultAbiCoder } from '@ethersproject/abi';

describe('VerifyingTokenPayAfterPaymaster', () => {
    const {provider} = ethers;

    let admin, beneficiary;
    let entryPoint;
    let entryPointAddress;
    let bicPermissions;
    let bicPermissionsAddress;
    let bicAccountFactory;
    let bicAccountFactoryAddress;
    let bicTokenPaymaster;
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

        const BicPermissions = await ethers.getContractFactory("BicPermissions");
        bicPermissions = await BicPermissions.deploy();
        await bicPermissions.waitForDeployment();
        bicPermissionsAddress = await bicPermissions.getAddress();

        const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");
        bicAccountFactory = await BicAccountFactory.deploy(entryPointAddress, bicPermissionsAddress);
        await bicAccountFactory.waitForDeployment();
        bicAccountFactoryAddress = await bicAccountFactory.getAddress();

        const BicTokenPaymaster = await ethers.getContractFactory("BicTokenPaymaster");
        bicTokenPaymaster = await BicTokenPaymaster.deploy(bicAccountFactoryAddress, entryPointAddress);
        await bicTokenPaymaster.waitForDeployment();
        legacyTokenPaymasterAddress = await bicTokenPaymaster.getAddress();

        await entryPoint.depositTo(legacyTokenPaymasterAddress as any, { value: parseEther('1000') } as any)

        smartWalletUser1Address = await bicAccountFactory.getFunction("getAddress")(user1.address as any, 0n as any);
        smartWalletUser2Address = await bicAccountFactory.getFunction("getAddress")(user2.address as any, 0n as any);
        console.log('smartWalletUser1Address: ', smartWalletUser1Address)
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
        await bicTokenPaymaster.transfer(simpleClaim.target, parseEther('1000'));
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
        await entryPoint.depositTo(verifyingTokenPayAfterPaymaster as any, { value: parseEther('1000') } as any)

    });

    it('should be able to claim', async () => {
        const proof = tree.getProof(0);
        console.log('Proof:', proof);
        console.log('user1:', admin.address);
        await simpleClaim.connect(admin).claim(proof, admin.address, 0, ethers.parseEther('100'));
        // const proof = tree.getProof(0)

    });

    it('user 1 with zero native token can claim', async () => {
        const createAccountCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [user1.address as any, ethers.ZeroHash]);
        const target = bicAccountFactoryAddress;
        const value = ethers.ZeroHash;
        const initCode = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), createAccountCallData]
        );

        const validAfter = Math.floor(Date.now() / 1000);
        const validUntil = validAfter + 60*60;
        const validTimeEncoded = defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]);
        console.log('validTimeEncoded: ', validTimeEncoded)
        const approveCallData = bicTokenPaymaster.interface.encodeFunctionData("approve", [verifyingTokenPayAfterPaymasterAddress, ethers.parseEther('100')]);
        const op = {
            sender: smartWalletUser1Address,
            nonce: 0,
            initCode: initCode,
            callData: approveCallData,
            callGasLimit: 5_000_000,
            verificationGasLimit: 5_000_000,
            preVerificationGas: 5_000_000,
            maxFeePerGas: 112,
            maxPriorityFeePerGas: 82,
            paymasterAndData: verifyingTokenPayAfterPaymasterAddress + legacyTokenPaymasterAddress.slice(2) + validTimeEncoded.slice(2) + '00'.repeat(64),
            signature: "0x"
        }


        const signPaymasterHash = await verifyingTokenPayAfterPaymaster.getHash(op as any, legacyTokenPaymasterAddress, validAfter as any, validUntil as any);
        const signaturePaymaster = await verifierWallet.signMessage(ethers.getBytes(signPaymasterHash));
        op.paymasterAndData = verifyingTokenPayAfterPaymasterAddress + legacyTokenPaymasterAddress.slice(2) + validTimeEncoded.slice(2) + signaturePaymaster.slice(2);

        const opHash = await entryPoint.getUserOpHash(op as any);
        const signature = await user1.signMessage(ethers.getBytes(opHash));
        op.signature = ethers.solidityPacked(["bytes"], [signature]);
        console.log('op: ', op)
        const tx = await entryPoint.handleOps([op] as any, admin.address);
        console.log('tx: ', tx);

        // // native token balance of user 1
        // expect(await provider.getBalance(smartWalletUser1Address)).to.equal(0);
        // const proof = tree.getProof(1);
        // const tx = await simpleClaim.connect(user1).claim(proof, smartWalletUser1Address, 1, ethers.parseEther('100'));
        // console.log('tx: ', tx);
        // expect(await simpleClaim.balanceOf(smartWalletUser1Address)).to.equal(ethers.parseEther('100'));
    });
});
