import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import {
  BicPermissions,
  TestERC20,
  BicTokenUnlock,
} from "../../../typechain-types";
import { contractFixture } from "../util/fixtures";

describe("BicTokenUnlock", function () {
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let bicPermissionsEnumerable: BicPermissions;
  let erc20: TestERC20;
  let bicTokenUnlock: BicTokenUnlock;

  before(async () => {
    const {
      deploySigner,
      signer1,
      signer2,
      testERC20Contract,
      bicTokenUnlockContract,
    } = await loadFixture(contractFixture);

    deployer = deploySigner;
    alice = signer1;
    bob = signer2;
    erc20 = testERC20Contract;
    bicTokenUnlock = bicTokenUnlockContract;
  });

  it("should have root updated by admin only", async () => {});
  it("should fail to update root for bad cycle", async () => {});
  it("should revert claim when user not confirm unlock rate", async () => {});
  it("should revert for incorrect claimIds, claimTimestamps, claimAmounts", async () => {});
  it("should recive correct amount when user try to send multi claim", async () => {});
  it("should claim properly base timestamp and block.timestamp", async () => {});
  it("should claim with fixed claim amount", async () => {});
  it("should claim with generated increasing claim cycle", async () => {});
});

//
const generateClaim = async () => {
  const exampleEntry = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    ["1@gmail.com-week-1", "1@gmail.com-week-2", "1@gmail.com-week-3"],
    ["1709714208", "1709714208", "1709714208"],
    ["10000000000000000000", "10000000000000000000", "10000000000000000000"],
  ];

  //
};
