import {ethers} from "hardhat";
import {BigNumberish, BytesLike, parseEther, Wallet} from "ethers";
import {BicAccount, BicAccountFactory, EntryPoint, LegacyTokenPaymaster} from "../../typechain-types";
import {expect} from "chai";
import {createOp} from "../util/createOp";

describe("LegacyTokenPaymaster", () => {
    const {provider} = ethers;
    let admin;
    let user1: Wallet = new ethers.Wallet("0x0000000000000000000000000000000000000000000000000000000000000001", provider)
    let user2: Wallet = new ethers.Wallet("0x0000000000000000000000000000000000000000000000000000000000000002", provider)
    let bicAccountFactory: BicAccountFactory;
    let bicAccountFactoryAddress: string;
    let entryPoint: EntryPoint;
    let entryPointAddress: string;
    let beneficiary: string;
    let legacyTokenPaymaster: LegacyTokenPaymaster;
    let legacyTokenPaymasterAddress: string;

    before(async () => {
        [admin, beneficiary] = await ethers.getSigners();
        bicAccountFactory = await ethers.getContractFactory("BicAccount") as BicAccountFactory;
        beneficiary = ethers.Wallet.createRandom().address;
        [admin] = await ethers.getSigners();
        const EntryPoint = await ethers.getContractFactory("EntryPointTest");
        entryPoint = await EntryPoint.deploy();
        await entryPoint.waitForDeployment();
        entryPointAddress = await entryPoint.getAddress();

        const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");
        bicAccountFactory = await BicAccountFactory.deploy(entryPointAddress);
        await bicAccountFactory.waitForDeployment();
        bicAccountFactoryAddress = await bicAccountFactory.getAddress();

        const LegacyTokenPaymaster = await ethers.getContractFactory("LegacyTokenPaymaster");
        legacyTokenPaymaster = await LegacyTokenPaymaster.deploy(bicAccountFactoryAddress, 'Beincom', entryPointAddress);
        await legacyTokenPaymaster.waitForDeployment();
        legacyTokenPaymasterAddress = await legacyTokenPaymaster.getAddress();

        await entryPoint.depositTo(legacyTokenPaymasterAddress as any, { value: parseEther('1000') } as any)
    });

    it('should be able to use to create account', async () => {
        const smartWalletAddress = await bicAccountFactory.getFunction("getAddress")(user1.address as any, 0n as any);
        expect(user1.address).equal("0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf");
        expect(smartWalletAddress).equal("0xb5B080c995e37F6f32E58c4B89eA247A7E138F72");

        await legacyTokenPaymaster.mintTokens(smartWalletAddress as any, ethers.parseEther('1000') as any);

        const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [user1.address as any, ethers.ZeroHash]);
        const target = bicAccountFactoryAddress;
        const value = ethers.ZeroHash;
        const initCode = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), initCallData]
        );
        const op = await createOp(smartWalletAddress, target, initCode, '0x', legacyTokenPaymasterAddress, 0n, user1, entryPoint);

        await entryPoint.handleOps([op] as any, admin.address);
        const smartWallet = await ethers.getContractAt("BicAccount", smartWalletAddress);
        // expect(await smartWallet.isAdmin(admin.address)).equal(true);
        // expect(await smartWallet.isAdmin(user1.address as any)).equal(true);
        console.log('balance after create: ', (await legacyTokenPaymaster.balanceOf(smartWalletAddress as any)).toString());
    })

    it('should be able to transfer tokens while create account', async () => {
        user1 = ethers.Wallet.createRandom() as Wallet
        user2 = ethers.Wallet.createRandom() as Wallet
        const smartWalletAddress1 = await bicAccountFactory.getFunction("getAddress")(user1.address as any, 0n as any);
        const smartWalletAddress2 = await bicAccountFactory.getFunction("getAddress")(user2.address as any, 0n as any);
        await legacyTokenPaymaster.mintTokens(smartWalletAddress1 as any, ethers.parseEther('1000') as any);

        const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [user1.address as any, ethers.ZeroHash]);
        const target = bicAccountFactoryAddress;
        const value = ethers.ZeroHash;
        const initCode = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), initCallData]
        );
        const createWalletOp = await createOp(smartWalletAddress1, target, initCode, '0x', legacyTokenPaymasterAddress, 0n, user1, entryPoint);

        const transferOp = await createOp(
            smartWalletAddress1,
            legacyTokenPaymasterAddress,
            '0x',
            legacyTokenPaymaster.interface.encodeFunctionData("transfer", [smartWalletAddress2, ethers.parseEther("100")]),
            legacyTokenPaymasterAddress,
            1n,
            user1,
            entryPoint
        );

        await entryPoint.handleOps([createWalletOp, transferOp] as any, admin.address);

        expect(await legacyTokenPaymaster.balanceOf(smartWalletAddress2 as any)).equal(ethers.parseEther('100'));
        console.log('balance after: ', (await legacyTokenPaymaster.balanceOf(smartWalletAddress1 as any)).toString());
    });

    it('should be able to use oracle for calculate transaction fees', async () => {
        user1 = ethers.Wallet.createRandom() as Wallet
        user2 = ethers.Wallet.createRandom() as Wallet
        const smartWalletAddress1 = await bicAccountFactory.getFunction("getAddress")(user1.address as any, 0n as any);
        const smartWalletAddress2 = await bicAccountFactory.getFunction("getAddress")(user2.address as any, 0n as any);
        await legacyTokenPaymaster.mintTokens(smartWalletAddress1 as any, ethers.parseEther('1000') as any);

        const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [user1.address as any, ethers.ZeroHash]);
        const target = bicAccountFactoryAddress;
        const value = ethers.ZeroHash;
        const initCode = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), initCallData]
        );
        const createWalletOp = await createOp(smartWalletAddress1, target, initCode, '0x', legacyTokenPaymasterAddress, 0n, user1, entryPoint);

        const transferOp = await createOp(
            smartWalletAddress1,
            legacyTokenPaymasterAddress,
            '0x',
            legacyTokenPaymaster.interface.encodeFunctionData("transfer", [beneficiary, ethers.parseEther("0")]),
            legacyTokenPaymasterAddress,
            1n,
            user1,
            entryPoint
        );

        await entryPoint.handleOps([createWalletOp, transferOp] as any, admin.address);
        const balanceLeft1 = await legacyTokenPaymaster.balanceOf(smartWalletAddress1 as any);

        const TestOracle = await ethers.getContractFactory("TestOracle");
        const testOracle = await TestOracle.deploy();
        await testOracle.waitForDeployment();
        const testOracleAddress = await testOracle.getAddress();
        await legacyTokenPaymaster.setOracle(testOracleAddress as any);
        await legacyTokenPaymaster.mintTokens(smartWalletAddress2 as any, ethers.parseEther('1000') as any);

        const initCallData2 = bicAccountFactory.interface.encodeFunctionData("createAccount", [user2.address as any, ethers.ZeroHash]);
        const target2 = bicAccountFactoryAddress;
        const value2 = ethers.ZeroHash;
        const initCode2 = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), initCallData2]
        );
        const createWalletOp2 = await createOp(smartWalletAddress2, target2, initCode2, '0x', legacyTokenPaymasterAddress, 0n, user2, entryPoint);

        const transferOp2 = await createOp(
            smartWalletAddress2,
            legacyTokenPaymasterAddress,
            '0x',
            legacyTokenPaymaster.interface.encodeFunctionData("transfer", [beneficiary, ethers.parseEther("0")]),
            legacyTokenPaymasterAddress,
            1n,
            user2,
            entryPoint
        );

        await entryPoint.handleOps([createWalletOp2, transferOp2] as any, admin.address);
        const balanceLeft2 = await legacyTokenPaymaster.balanceOf(smartWalletAddress2 as any);

        expect((ethers.parseEther('1000') - balanceLeft1)/(ethers.parseEther('1000') - balanceLeft2)).equal(99);
    });
});
