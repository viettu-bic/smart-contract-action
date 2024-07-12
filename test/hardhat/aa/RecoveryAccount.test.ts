import { expect } from "chai";
import { ethers } from "hardhat";
import { BicAccountFactory, BicAccount, EntryPoint } from "../../../typechain-types";

describe("RecoveryAccount", function () {
  let bicFactory: BicAccountFactory;
  let entryPoint: EntryPoint;


  // constants

  async function getEOAAccounts() {
    const [deployer, wallet1, wallet2, wallet3] = await ethers.getSigners();

    return { deployer, wallet1, wallet2, wallet3 };
  }

  before(async () => {
    const { deployer: recoverer } = await getEOAAccounts();
    const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");
    const EntryPoint = await ethers.getContractFactory("EntryPoint");

    entryPoint = await EntryPoint.deploy();
    await entryPoint.waitForDeployment();

    bicFactory = await BicAccountFactory.deploy(entryPoint.target, recoverer.address);
    await bicFactory.waitForDeployment();


  });


  it("Should change owner successfully when has recovery role", async function () {
    const salt = ethers.concat([ethers.ZeroHash, Buffer.from(Date.now().toString())]);
    const { deployer: recoverer, wallet1, wallet2 } = await getEOAAccounts();

    // Create Account for wallet1
    const accountAddress1 = await bicFactory.getFunction("getAddress")(wallet1.address, salt);
    const createTx1 = await bicFactory.createAccount(wallet1.address, salt);
    await createTx1.wait();

    const account1 = await ethers.getContractAt("BicAccount", accountAddress1);

    expect((await account1.owner()).toLowerCase()).to.be.eq(wallet1.address.toLowerCase());

    const preOwner = await account1.owner();
    expect(preOwner.toLowerCase()).to.be.eq(wallet1.address.toLowerCase());

    const changeTx = await account1.connect(recoverer).changeOwner(wallet2.address);
    await changeTx.wait();

    const nextOwner = await account1.owner();
    expect(nextOwner.toLowerCase()).to.be.eq(wallet2.address.toLowerCase());
  });

  it("Should change owner successfully when onlyOwner", async function () {
    const salt = ethers.concat([ethers.ZeroHash, Buffer.from(Date.now().toString())]);
    const { wallet1, wallet2 } = await getEOAAccounts();

    // Create Account for wallet1
    const accountAddress1 = await bicFactory.getFunction("getAddress")(wallet1.address, 1);
    const createTx1 = await bicFactory.createAccount(wallet1.address, 1);
    await createTx1.wait();

    const account1 = await ethers.getContractAt("BicAccount", accountAddress1);

    expect((await account1.owner()).toLowerCase()).to.be.eq(wallet1.address.toLowerCase());


    const preOwner = await account1.owner();
    expect(preOwner.toLowerCase()).to.be.eq(wallet1.address.toLowerCase());

    const changeTx = await account1.connect(wallet1).changeOwner(wallet2.address);
    await changeTx.wait();

    const nextOwner = await account1.owner();
    expect(nextOwner.toLowerCase()).to.be.eq(wallet2.address.toLowerCase());
  });


  it("Should change owner failed when has not role recovery or owner", async function () {
    const salt = ethers.concat([ethers.ZeroHash, Buffer.from(Date.now().toString())]);
    const { wallet3: notRecoverer, wallet2 } = await getEOAAccounts();

    const accountAddress2 = await bicFactory.getFunction("getAddress")(wallet2.address, salt);
    const createTx2 = await bicFactory.createAccount(wallet2.address, salt);
    await createTx2.wait();

    const account2 = await ethers.getContractAt("BicAccount", accountAddress2);
    expect((await account2.owner()).toLowerCase()).to.be.eq(wallet2.address.toLowerCase());

    const preOwner = await account2.owner();
    expect(preOwner.toLowerCase()).to.be.eq(wallet2.address.toLowerCase());

    const changeTx = account2.connect(notRecoverer).changeOwner(wallet2.address);

    await expect(changeTx).to.be.revertedWith("only owner or operator role");
  });
});
