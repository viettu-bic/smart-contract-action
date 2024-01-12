import {expect} from "chai";
import {parseEther, Wallet} from "ethers";
import {ethers} from "hardhat";
import {BicAccount, BicAccountFactory, EntryPoint, LegacyTokenPaymaster, TokenPaymaster} from "../../typechain-types";
import {OracleHelper, UniswapHelper} from "../../typechain-types/contracts/smart-wallet/paymaster/TokenPaymaster";
import {createOp} from "../util/createOp";

describe("TokenPaymaster", () => {
    const {provider} = ethers;
    let admin;
    let user1: Wallet = new ethers.Wallet("0x0000000000000000000000000000000000000000000000000000000000000001", provider)
    let user2: Wallet = new ethers.Wallet("0x0000000000000000000000000000000000000000000000000000000000000002", provider)
    let bicAccountFactory: BicAccountFactory;
    let bicAccountFactoryAddress: string;
    let entryPoint: EntryPoint;
    let entryPointAddress: string;
    let bicToken: LegacyTokenPaymaster;
    let bicTokenAddress: string;
    let beneficiary: string;
    let paymaster: TokenPaymaster;
    let paymasterAddress: string;

    beforeEach(async () => {
        beneficiary = ethers.Wallet.createRandom().address;
        [admin] = await ethers.getSigners();
        const EntryPoint = await ethers.getContractFactory("EntryPoint");
        entryPoint = await EntryPoint.deploy();
        await entryPoint.waitForDeployment();
        entryPointAddress = await entryPoint.getAddress();

        const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");
        bicAccountFactory = await BicAccountFactory.deploy(entryPointAddress);
        await bicAccountFactory.waitForDeployment();
        bicAccountFactoryAddress = await bicAccountFactory.getAddress();

        const BicToken = await ethers.getContractFactory("LegacyTokenPaymaster");
        bicToken = await BicToken.deploy(bicAccountFactoryAddress, 'Beincom', entryPointAddress);
        await bicToken.waitForDeployment();
        bicTokenAddress = await bicToken.getAddress();


        const WrapEth = await ethers.getContractFactory("WrapEth");
        const wrapEth = await WrapEth.deploy();
        await wrapEth.waitForDeployment();
        const wrapEthAddress = await wrapEth.getAddress();

        const TestUniswap = await ethers.getContractFactory("TestUniswap");
        const testUniswap = await TestUniswap.deploy(wrapEthAddress);
        await testUniswap.waitForDeployment();
        const testUniswapAddress = await testUniswap.getAddress();

        const initialPriceToken = 100000000 // USD per BIC
        const initialPriceEther = 500000000 // USD per ETH

        const TestOracle = await ethers.getContractFactory("TestOracle");
        const nativeAssetOracle = await TestOracle.deploy(initialPriceEther, 8);
        await nativeAssetOracle.waitForDeployment();
        const nativeAssetOracleAddress = await nativeAssetOracle.getAddress();

        const tokenOracle = await TestOracle.deploy(initialPriceToken, 8);
        await tokenOracle.waitForDeployment();
        const tokenOracleAddress = await tokenOracle.getAddress();

        await wrapEth.deposit({ value: parseEther('2') } as any)
        await wrapEth.transfer(testUniswapAddress as any, parseEther('2') as any)

        const minEntryPointBalance = 1e17.toString()
        const priceDenominator = ethers.parseUnits('1', 26)

        const tokenPaymasterConfig: TokenPaymaster.TokenPaymasterConfigStruct = {
            priceMaxAge: 86400,
            refundPostopCost: 40000,
            minEntryPointBalance,
            priceMarkup: priceDenominator * 15n / 10n, // +50%
        }

        const oracleHelperConfig: OracleHelper.OracleHelperConfigStruct = {
            cacheTimeToLive: 0,
            nativeOracle: nativeAssetOracleAddress,
            nativeOracleReverse: false,
            priceUpdateThreshold: 200_000, // +20%
            tokenOracle: tokenOracleAddress,
            tokenOracleReverse: false,
            tokenToNativeOracle: false
        }

        const uniswapHelperConfig: UniswapHelper.UniswapHelperConfigStruct = {
            minSwapAmount: 1,
            slippage: 5,
            uniswapPoolFee: 3
        }

        const TokenPaymaster = await ethers.getContractFactory("TokenPaymaster");
        paymaster = await TokenPaymaster.deploy(
            bicTokenAddress,
            entryPointAddress,
            wrapEthAddress,
            testUniswapAddress,
            tokenPaymasterConfig,
            oracleHelperConfig,
            uniswapHelperConfig,
            admin.address
        );
        await paymaster.waitForDeployment();
        paymasterAddress = await paymaster.getAddress();

    });


    async function createAndApproveBicToken(smartWalletAddress: string, approveAddress: string = ethers.ZeroAddress, user: Wallet = user1): Promise<any> {
        const smartWallet: BicAccount = await ethers.getContractAt("BicAccount", smartWalletAddress);
        const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [user.address as any, ethers.ZeroHash]);
        const target = bicAccountFactoryAddress;
        const value = ethers.ZeroHash;

        const callDataForEntrypoint = smartWallet.interface.encodeFunctionData("execute", [target, value, ethers.ZeroHash]);
        const initCode = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), initCallData]
        );
        const createWalletOp = await createOp(smartWalletAddress, bicTokenAddress, initCode, callDataForEntrypoint, '0x', 0n, user, entryPoint);

        const approveOp = await createOp(smartWalletAddress, bicTokenAddress, "0x", bicToken.interface.encodeFunctionData("approve", [approveAddress, ethers.MaxUint256]), '0x', 1n, user, entryPoint);

        const collect10TokenOp = await createOp(smartWalletAddress, bicTokenAddress, "0x", bicToken.interface.encodeFunctionData("transfer", [approveAddress, ethers.parseEther("10")]), '0x', 2n, user, entryPoint);

        await entryPoint.handleOps([createWalletOp, approveOp, collect10TokenOp] as any, beneficiary as any);
    }


    it("should transfer bic token to user 2 and auto refill deposit (using token paymaster)", async () => {
        // await bicToken.transfer(paymasterAddress as any, '100' as any)
        await paymaster.updateCachedPrice(true as any)
        await entryPoint.depositTo(paymasterAddress as any, { value: parseEther('0.1') } as any)
        // await paymaster.addStake(1 as any, { value: parseEther('2') } as any)

        const smartWalletAddress1 = await bicAccountFactory.getFunction("getAddress")(user1.address as any, 0n as any);
        await bicToken.mintTokens(smartWalletAddress1 as any, ethers.parseEther("1000") as any);
        expect(await bicToken.balanceOf(smartWalletAddress1 as any)).equal(ethers.parseEther("1000"));
        console.log('before create and approve')
        await createAndApproveBicToken(smartWalletAddress1, paymasterAddress);

        const initCallData = bicToken.interface.encodeFunctionData("transfer", [user2.address as any, ethers.parseEther("100") as any]);
        console.log('before transfer')
        const transferOp = await createOp(smartWalletAddress1, bicTokenAddress,  "0x", initCallData, paymasterAddress, 0n, user1, entryPoint);

        const ethAdminBalanceBefore = await provider.getBalance(admin.address);
        console.log('ethAdminBalanceBefore: ', ethAdminBalanceBefore.toString())
        console.log('ethDepositPaymasterBalanceBefore: ', await entryPoint.getDepositInfo(paymasterAddress as any))

        console.log('paymasterAddress: ', paymasterAddress);
        console.log('smartWalletAddress1: ', smartWalletAddress1)
        await entryPoint.connect(admin).handleOps([transferOp] as any, beneficiary as any);

        const ethAdminBalanceAfter = await provider.getBalance(admin.address);
        console.log('ethAdminBalanceAfter: ', ethAdminBalanceAfter.toString())
        console.log('ethDepositPaymasterBalanceAfter: ', await entryPoint.getDepositInfo(paymasterAddress as any))

        console.log('beneficiary eth after: ', await provider.getBalance(beneficiary))
        expect(await bicToken.balanceOf(user2.address as any)).equal(ethers.parseEther("100"));
    });
})
