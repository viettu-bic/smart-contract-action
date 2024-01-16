import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { contractFixture } from "../util/fixtures";
import { ethers } from "hardhat";
import { expect } from "chai";


describe("BicAccountUUPS", function () {
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

  it("BicAccount and BicAccountFactory should work properly", async () => {
    const { user1, bicAccountFactory } = await loadFixture(contractFixture);

    // Create smart wallet
    const salt = 0;
    const user1SmartWalletAddress = await bicAccountFactory.getFunction("getAddress")(user1.address, salt);
    const user1SmartWallet = await createAccount(user1, salt);

    // Expect
    expect(user1SmartWalletAddress).equal(user1SmartWallet.target);
    expect(await ethers.provider.getBalance(user1SmartWallet.target)).greaterThan(ethers.parseEther("0.9"));
  });

  it("User1's BicAccount should work properly after upgrade to new implementation", async () => {
    const { user1, beneficiary, bicAccountFactory, entryPoint, bicAccountV2 } = await loadFixture(contractFixture);

    // Create account
    const salt = 0;
    let user1SmartWallet = await createAccount(user1, salt);

    // // Transfer eth to some one
    await user1SmartWallet.connect(user1).execute(beneficiary, ethers.parseEther("0.1"), "0x");
    expect(await ethers.provider.getBalance(user1SmartWallet.target)).greaterThan(ethers.parseEther("0.8"));

    let bicAccountVersion = await user1SmartWallet.connect(user1).version();
    // Check version before upgrade
    expect(parseInt(bicAccountVersion.toString())).equal(1);
 
    // Upgrade the user1SmartWallet to new implementation
    await user1SmartWallet.connect(user1).upgradeTo(bicAccountV2.target);

    // Check version
    user1SmartWallet = await ethers.getContractAt("BicAccount2", user1SmartWallet.target);
    bicAccountVersion = await user1SmartWallet.connect(user1).version();
    expect(parseInt(bicAccountVersion.toString())).equal(2);

    // Make sure everything stil okey
    await user1SmartWallet.connect(user1).execute(beneficiary, ethers.parseEther("0.1"), "0x");
    expect(await ethers.provider.getBalance(user1SmartWallet.target)).greaterThan(ethers.parseEther("0.7"));
  });

  it("BicAccount and BicAccountFactory should work properly after upgrade", async () => {
    // This is question mark when new logic deploying, that mean the, so make some test okey
  });
});
