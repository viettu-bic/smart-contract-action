import { expect } from "chai";
import { ethers } from "hardhat";
import { BicPermissions, EntryPoint } from "../../typechain-types";

describe("RecoveryAccount", function () {
  let bicPermissionsEnumerable: BicPermissions;
  let bicFactory: BicPermissions;
  let entryPoint: EntryPoint;

  // constants
  const noPermissionError = (adminRole: string, account: string) => `AccessControl: account ${account} is missing role ${adminRole}`;

  async function getEOAAccounts() {
    const [deployer, wallet1, wallet2] = await ethers.getSigners();

    return { deployer, wallet1, wallet2 };


  }

  before(async () => {
    const BicPermissionsEnumerable = await ethers.getContractFactory("BicPermissions");
    const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");
    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
    await bicPermissionsEnumerable.waitForDeployment();
    
    entryPoint = await EntryPoint.deploy();
    await entryPoint.waitForDeployment();

    bicFactory = await BicAccountFactory.deploy(entryPoint.target);
    await bicFactory.waitForDeployment();



  });


});
