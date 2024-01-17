import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { BicAccount, EntryPoint, BicPermissions, BicAccountFactory, BicAccount2, TestERC20, TestERC721 } from "../../typechain-types";
import { contractFixture } from "../util/fixtures";

describe("BicAccountUUPS", function () {
  // Constant
  const nonceKey = 0n;
  const salt = 0n;

  // Fixture
  let deployer: SignerWithAddress;
  let Jack: SignerWithAddress;
  let Lily: SignerWithAddress;
  let beneficiary: SignerWithAddress;
  let entryPoint: EntryPoint;
  let bicPermissionsEnumerable: BicPermissions;
  let bicAccountFactory: BicAccountFactory;
  let bicAccountV2: BicAccount2;
  let testERC20: TestERC20;
  let testERC721: TestERC721;

  // Smart Wallet
  let smartWalletForJack: BicAccount;
  let smartWalletForLily: BicAccount;

  // List test case here
  // 1: Everything before upgrade should work properly
  // 1.1: Create account
  // 1.2: Recive eth and send eth
  // 1.3: Send and recive erc20
  // 1.4: Send and recive erc721

  // 2: User smart wallet's storage should work properly
  // 2.1: Blance ok
  // 2.2: Assets ok
  // 2.3: erc20 and erc721 ok

  // 3: Security
  // 3.1: only owner can do upgrade
  // 3.2: operator can do upgrade
  // 3.3: owner can
  const createAccount = async (signer: any, salt: number) => {
    const { entryPoint, bicAccountFactory, beneficiary } = await loadFixture(contractFixture);
    const smartWalletAddress = await bicAccountFactory.getFunction("getAddress")(signer.address, salt);
    const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [signer.address, salt]);
    const initCode = ethers.solidityPacked(["address", "bytes"], [bicAccountFactory.target, initCallData]);
    const nonce = await entryPoint.getNonce(smartWalletAddress, salt);

    const op = {
      sender: smartWalletAddress,
      nonce: nonce.toString(),
      initCode: initCode,
      callData: "0x",
      callGasLimit: 0,
      verificationGasLimit: "3000000",
      preVerificationGas: "5000000",
      maxFeePerGas: "3000000",
      maxPriorityFeePerGas: "3000000",
      paymasterAndData: "0x",
      signature: "0x",
    };
    const opHash = await entryPoint.getUserOpHash(op);
    const signature = await signer.signMessage(ethers.getBytes(opHash));
    const signedOP = { ...op, signature: signature };

    // Fund
    await signer.sendTransaction({
      to: smartWalletAddress,
      value: ethers.parseEther("1"),
    });

    // handleOps
    await entryPoint.connect(signer).handleOps([signedOP], beneficiary);
    return await ethers.getContractAt("BicAccount", smartWalletAddress);
  };

  // runs before all tests in this file regardless where this line is defined.
  before(async () => {
    const {
      deploySigner,
      signer1,
      signer2,
      beneficiarySigner,
      entryPointContract,
      bicPermissionsEnumerableContract,
      bicAccountFactoryContract,
      bicAccountV2Contract,
      testERC20Contract,
      testERC721Contract,
    } = await loadFixture(contractFixture);

    deployer = deploySigner;
    Jack = signer1;
    Lily = signer2;
    beneficiary = beneficiarySigner;

    entryPoint = entryPointContract;
    bicPermissionsEnumerable = bicPermissionsEnumerableContract;
    bicAccountFactory = bicAccountFactoryContract;
    bicAccountV2 = bicAccountV2Contract;
    testERC20 = testERC20Contract;
    testERC721 = testERC721Contract;
  });

  const createUserOp = async (sender: string, nonce: BigInt, initCode: string, callData: string) => {
    return {
      sender: sender,
      nonce: nonce.toString(),
      initCode: initCode,
      callData: callData,
      callGasLimit: 5_000_000, // TODO, need to be set to 0 when create account
      verificationGasLimit: 3_000_000,
      preVerificationGas: 5_000_000,
      maxFeePerGas: 3_000_000,
      maxPriorityFeePerGas: 3_000_000,
      paymasterAndData: "0x",
      signature: "0x",
    };
  };

  const print = async () => {
    console.log(``);
    console.log(`      ########################################################`);
    console.log(`      $ Jack   balance       :        ${ethers.formatEther(await ethers.provider.getBalance(Jack.address))} eth`);
    console.log(`      $ Jack's balance       :        ${ethers.formatEther(await ethers.provider.getBalance(smartWalletForJack.target))} eth`);
    console.log(`      $ Jack's erc20 balance :        ${ethers.formatEther(await testERC20.balanceOf(smartWalletForJack.target))} token`);
    console.log(`      --------------------------------------------------------`);
    console.log(`      $ Lily   balance       :        ${ethers.formatEther(await ethers.provider.getBalance(Lily.address))} eth`);
    console.log(`      $ Lily's balance       :        ${ethers.formatEther(await ethers.provider.getBalance(smartWalletForLily.target))} eth`);
    console.log(`      $ Lily's erc20 balance :        ${ethers.formatEther(await testERC20.balanceOf(smartWalletForLily.target))} token`);
    console.log(`      #######################################################`);
    console.log(``);
  };

  describe("BicAccount should work properly", () => {
    it("Jack should create account properly", async () => {
      // Prepare for create account uer operation
      const smartWalletAddress = await bicAccountFactory.getFunction("getAddress")(Jack.address, salt);
      const nonce = await entryPoint.getNonce(smartWalletAddress, nonceKey);
      const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [Jack.address, salt]);
      const initCode = ethers.solidityPacked(["address", "bytes"], [bicAccountFactory.target, initCallData]);
      const userOp = await createUserOp(smartWalletAddress, nonce, initCode, "0x");

      // Sign for this userOP
      const opHash = await entryPoint.getUserOpHash(userOp);
      const signature = await Jack.signMessage(ethers.getBytes(opHash));
      const userOpSigned = { ...userOp, signature: signature };

      // Transfer gas fee for first time
      await Jack.sendTransaction({
        to: smartWalletAddress,
        value: ethers.parseEther("1"),
      });

      // handleOps
      await entryPoint.connect(Jack).handleOps([userOpSigned], beneficiary);

      // Get wallet
      smartWalletForJack = await ethers.getContractAt("BicAccount", smartWalletAddress);

      // Expect
      expect(smartWalletAddress).equal(smartWalletForJack.target);
      expect(await ethers.provider.getBalance(smartWalletAddress)).greaterThan(ethers.parseEther("0.9"));
    });

    it("Lily should create account properly", async () => {
      // Prepare for create account uer operation
      const smartWalletAddress = await bicAccountFactory.getFunction("getAddress")(Lily.address, salt);
      const nonce = await entryPoint.getNonce(smartWalletAddress, nonceKey);
      const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [Lily.address, salt]);
      const initCode = ethers.solidityPacked(["address", "bytes"], [bicAccountFactory.target, initCallData]);
      const userOp = await createUserOp(smartWalletAddress, nonce, initCode, "0x");

      // Sign for this userOP
      const opHash = await entryPoint.getUserOpHash(userOp);
      const signature = await Lily.signMessage(ethers.getBytes(opHash));
      const userOpSigned = { ...userOp, signature: signature };

      // Transfer gas fee for first time
      await Lily.sendTransaction({
        to: smartWalletAddress,
        value: ethers.parseEther("1"),
      });

      // handleOps
      await entryPoint.connect(Lily).handleOps([userOpSigned], beneficiary);

      // Get wallet
      smartWalletForLily = await ethers.getContractAt("BicAccount", smartWalletAddress);

      // Expect
      expect(smartWalletAddress).equal(smartWalletForLily.target);
      expect(await ethers.provider.getBalance(smartWalletAddress)).greaterThan(ethers.parseEther("0.9"));
    });

    it("Jack send eth to his smart wallet", async () => {
      await Jack.sendTransaction({
        to: smartWalletForJack.target,
        value: ethers.parseEther("0.2"),
      });

      expect(await ethers.provider.getBalance(smartWalletForJack.target)).greaterThan(ethers.parseEther("1"));
    });

    it("Jack smart wallet send to Lily smart wallet", async () => {
      // Prepare for send transaction
      const nonce = await entryPoint.getNonce(smartWalletForJack.target, nonceKey);
      const callData = smartWalletForJack.interface.encodeFunctionData("execute", [smartWalletForLily.target, ethers.parseEther("0.5"), "0x"]);
      const userOp = await createUserOp(smartWalletForJack.target as string, nonce, "0x", callData);

      // Sign
      const opHash = await entryPoint.getUserOpHash(userOp);
      const signature = await Jack.signMessage(ethers.getBytes(opHash));
      const userOpSigned = { ...userOp, signature: signature };

      // handleOps
      await entryPoint.connect(Jack).handleOps([userOpSigned], beneficiary);

      // Expectation
      expect(await ethers.provider.getBalance(smartWalletForJack)).lessThan(ethers.parseEther("0.7"));
      expect(await ethers.provider.getBalance(smartWalletForLily)).greaterThan(ethers.parseEther("1.4"));
    });

    it("Lily smart wallet send to Jack smart wallet", async () => {
      await smartWalletForLily.connect(Lily).execute(smartWalletForJack.target, ethers.parseEther("0.1"), "0x");

      // Expectation
      expect(await ethers.provider.getBalance(smartWalletForJack)).lessThan(ethers.parseEther("0.8"));
      expect(await ethers.provider.getBalance(smartWalletForLily)).greaterThan(ethers.parseEther("1.3"));
    });

    it("Should recive erc20 properly", async () => {
      // Recive
      await testERC20.connect(deployer).transfer(smartWalletForJack.target, ethers.parseEther("100"));
      await testERC20.connect(deployer).transfer(smartWalletForLily.target, ethers.parseEther("500"));

      // Expection
      expect(await testERC20.balanceOf(smartWalletForJack.target)).equal(ethers.parseEther("100"));
      expect(await testERC20.balanceOf(smartWalletForLily.target)).equal(ethers.parseEther("500"));
    });

    it("Should send erc20 properly");
    it("Should send and recive erc721 properly");
  });

  describe("BicAccount should work properly after upgrade implementation", () => {
    it("Jack and Lily assets should keep properly after upgrade", async () => {
      // Expectation the current version of BicAccount
      expect(await smartWalletForJack.version()).equal(1n);
      expect(await smartWalletForLily.version()).equal(1n);

      // Perform upgrade
      await smartWalletForJack.connect(Jack).upgradeTo(bicAccountV2.target);

      // Expectation the upgrade version of BicAccount
      expect(await smartWalletForJack.version()).equal(2n);

      // Expectation the assets
      expect(await ethers.provider.getBalance(smartWalletForJack)).lessThan(ethers.parseEther("0.8"));
      expect(await ethers.provider.getBalance(smartWalletForLily)).greaterThan(ethers.parseEther("1.3"));
      expect(await testERC20.balanceOf(smartWalletForJack.target)).equal(ethers.parseEther("100"));
      expect(await testERC20.balanceOf(smartWalletForLily.target)).equal(ethers.parseEther("500"));
    });

    it("should send and recive native token properly after upgrade");

    it("should send and recive erc20 properly after upgrade");

    it("should send and recive erc721 properly after upgrade");
  });

  describe("Security", () => {
    it("only owner can do upgrade");
    it("only operator can do upgrade");
  });

  describe("Should pass upgrade checklist from openzepplin", () => {
    it("upgrade safe");
    it("compatible");
  });

  // it("BicAccount and BicAccountFactory should work properly", async () => {
  //   const { user1, bicAccountFactory } = await loadFixture(contractFixture);

  //   // Create smart wallet
  //   const salt = 0;
  //   const user1SmartWalletAddress = await bicAccountFactory.getFunction("getAddress")(user1.address, salt);
  //   const user1SmartWallet = await createAccount(user1, salt);

  //   // Expect
  //   expect(user1SmartWalletAddress).equal(user1SmartWallet.target);
  //   expect(await ethers.provider.getBalance(user1SmartWallet.target)).greaterThan(ethers.parseEther("0.9"));
  // });

  // it("User1's BicAccount should work properly after upgrade to new implementation", async () => {
  //   const { user1, beneficiary, bicAccountFactory, entryPoint, bicAccountV2 } = await loadFixture(contractFixture);

  //   // Create account
  //   const salt = 0;
  //   let user1SmartWallet = await createAccount(user1, salt);

  //   // // Transfer eth to some one
  //   await user1SmartWallet.connect(user1).execute(beneficiary, ethers.parseEther("0.1"), "0x");
  //   expect(await ethers.provider.getBalance(user1SmartWallet.target)).greaterThan(ethers.parseEther("0.8"));

  //   let bicAccountVersion = await user1SmartWallet.connect(user1).version();
  //   // Check version before upgrade
  //   expect(parseInt(bicAccountVersion.toString())).equal(1);

  //   // Upgrade the user1SmartWallet to new implementation
  //   await user1SmartWallet.connect(user1).upgradeTo(bicAccountV2.target);

  //   // Check version
  //   user1SmartWallet = await ethers.getContractAt("BicAccount2", user1SmartWallet.target);
  //   bicAccountVersion = await user1SmartWallet.connect(user1).version();
  //   expect(parseInt(bicAccountVersion.toString())).equal(2);

  //   // Make sure everything stil okey
  //   await user1SmartWallet.connect(user1).execute(beneficiary, ethers.parseEther("0.1"), "0x");
  //   expect(await ethers.provider.getBalance(user1SmartWallet.target)).greaterThan(ethers.parseEther("0.7"));
  // });

  // it("BicAccount and BicAccountFactory should work properly after upgrade", async () => {
  //   // This is question mark when new logic deploying, that mean the, so make some test okey
  // });
});
