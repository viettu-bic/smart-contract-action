
import { expect } from "chai";
import { ethers } from "hardhat";
import moment from "moment";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { BicUnlockFactory, BicUnlockTokenV2, TestERC20 } from "../../../typechain-types";
import { getEOAAccounts } from "../util/getEoaAccount";

describe("BicUnlockTokenV2 Test", function () {
  let bicUnlockTokenV2: BicUnlockTokenV2;
  let bicUnlockFactory: BicUnlockFactory;
  let testERC20: TestERC20;

  const P_DECIMALS = 100_000;
  const timeSpan = moment.duration(200, "weeks").asSeconds();
  console.log("🚀 ~ timeSpan:", timeSpan)

  before(async () => {
    const BicUnlockFactory = await ethers.getContractFactory("BicUnlockFactory");
    bicUnlockFactory = await BicUnlockFactory.deploy(ethers.ZeroAddress);
    await bicUnlockFactory.waitForDeployment();
    const bicUnlockImplementation = await bicUnlockFactory.bicUnlockImplementation();

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    testERC20 = await TestERC20.deploy();
    await testERC20.waitForDeployment();

    // approve Admin's token for Factory
    const approveTx = await testERC20.approve(bicUnlockFactory.target, ethers.MaxUint256);
    await approveTx.wait();
  });

  describe("Bic Unlock factory", () => {
    it("should create unlock success fully", async () => {
      const salt = moment().unix().toString();
      const { wallet1: beneficiary } = await getEOAAccounts();

      /**
       * Except returned
       * @count 196
       * 
       */
      const speedRateNumber = 1.8;
      const speedRate = ethers.parseUnits((100 - speedRateNumber).toString(), 3); // 2% / 1_000
      const duration = moment.duration(1, "weeks").asSeconds();
      const totalAmount = ethers.parseUnits("4000", 18);
      const weeksRemaining = timeSpan * ((100 - speedRateNumber) / 100);
      const countExpect = BigInt(Math.round((timeSpan * ((100 - speedRateNumber) / 100) / duration)));


      const unlockAddress = await bicUnlockFactory.computeUnlock(testERC20.target, totalAmount, beneficiary.address, timeSpan, duration, speedRate, salt);
      const createTx = await bicUnlockFactory.createUnlock(testERC20.target, totalAmount, beneficiary.address, timeSpan, duration, speedRate, salt);
      const receipt = await createTx.wait();

      bicUnlockTokenV2 = await ethers.getContractAt("BicUnlockTokenV2", unlockAddress);

      const start = await bicUnlockTokenV2.start();
      const end = await bicUnlockTokenV2.end();
      const count = await bicUnlockTokenV2.count();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);
      expect(start).to.be.eq(block?.timestamp);
      expect(end).to.be.eq(start + BigInt(weeksRemaining));
      expect(count).to.be.eq(countExpect);

      const amountPerDuration = await bicUnlockTokenV2.amountPerDuration();
      const amountPerSecond = await bicUnlockTokenV2.amountPerSecond();

      const totalAmountActual = amountPerSecond * BigInt(weeksRemaining);
      const balanceOfUnlockContract = await testERC20.balanceOf(bicUnlockTokenV2.target);
      expect(totalAmountActual).to.lessThanOrEqual(balanceOfUnlockContract);
    })
  });






  describe("Case with beauty number without remain time", () => {
    const salt = "123";

    const speedRateNumber = 2;
    const speedRate = ethers.parseUnits((100 - speedRateNumber).toString(), 3); // 2% / 1_000
    const duration = moment.duration(1, "weeks").asSeconds();
    const totalAmount = ethers.parseUnits("4000", 18);
    const countExpect = BigInt(Math.round((timeSpan * ((100 - speedRateNumber) / 100) / duration)));
    const weeksRemaining = timeSpan * ((100 - speedRateNumber) / 100)

    before(async () => {
      const { wallet1: beneficiary } = await getEOAAccounts();

      const unlockAddress = await bicUnlockFactory.computeUnlock(testERC20.target, totalAmount, beneficiary.address, timeSpan, duration, speedRate, salt);
      const createTx = await bicUnlockFactory.createUnlock(testERC20.target, totalAmount, beneficiary.address, timeSpan, duration, speedRate, salt);
      const receipt = await createTx.wait();

      bicUnlockTokenV2 = await ethers.getContractAt("BicUnlockTokenV2", unlockAddress);

      const balanceOf = await testERC20.balanceOf(unlockAddress);
      expect(balanceOf).to.be.eq(totalAmount);

      bicUnlockTokenV2 = await ethers.getContractAt("BicUnlockTokenV2", unlockAddress);

      const start = await bicUnlockTokenV2.start();
      const end = await bicUnlockTokenV2.end();
      const count = await bicUnlockTokenV2.count();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);
      expect(start).to.be.eq(block?.timestamp);
      expect(end).to.be.eq(start + BigInt(weeksRemaining));
      expect(count).to.be.eq(countExpect);

    });

    it("should not unlock token successfully if not passed duration", async () => {
      const releasableData = await bicUnlockTokenV2["releasable()"]();

      expect(releasableData[0]).to.be.eq(BigInt(0));
      expect(releasableData[1]).to.be.eq(BigInt(0));
      const vestTx = bicUnlockTokenV2.release();
      await expect(vestTx).revertedWith("VestingWallet: no tokens to release");
    });

    it("should unlock token successfully if passed 4 durations", async () => {
      const { wallet1: beneficiary } = await getEOAAccounts();

      const start = await bicUnlockTokenV2.start();
      const currentCount = await bicUnlockTokenV2.currentCount();
      const n = 4; // 4 durations(weeks)
      const expectAmount = BigInt(n) * totalAmount / countExpect;

      const timePassed = start + BigInt(moment.duration(n, "weeks").asSeconds());
      await helpers.time.increaseTo(timePassed);

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      // expect(releasableData[0]).to.be.eq(expectAmount);
      expect(releasableData[1]).to.be.eq(BigInt(n));
      expect(currentCount).to.be.eq(BigInt(0));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      await vestTx.wait();

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);

      expect(balanceOfNext).to.be.eq(balanceOfPrev + releasableData[0]);
    });

    it("should unlock token successfully if passed more(15) durations", async () => {
      const { wallet1: beneficiary } = await getEOAAccounts();

      const count = await bicUnlockTokenV2.count();
      const start = await bicUnlockTokenV2.lastAtCurrentCount();
      const currentCountPrev = await bicUnlockTokenV2.currentCount();
      const n = 15; // 15 durations(weeks)
      const expectAmount = BigInt(n) * totalAmount / count;

      const timePassed = start + BigInt(moment.duration(n, "weeks").asSeconds());
      await helpers.time.increaseTo(timePassed);

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      // expect(releasableData[0]).to.be.eq(expectAmount);
      expect(releasableData[1]).to.be.eq(BigInt(n));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      await vestTx.wait();

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);
      const currentCountNext = await bicUnlockTokenV2.currentCount();

      expect(balanceOfNext).to.be.eq(balanceOfPrev + releasableData[0]);
      expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(n));
    });

    it("should unlock token successfully if passed full durations", async () => {
      const { wallet1: beneficiary } = await getEOAAccounts();

      const count = await bicUnlockTokenV2.count();
      const start = await bicUnlockTokenV2.lastAtCurrentCount();
      const currentCountPrev = await bicUnlockTokenV2.currentCount();
      const n = count - currentCountPrev;

      const timePassed = start + BigInt(moment.duration(Number(n), "weeks").asSeconds());
      await helpers.time.increaseTo(timePassed);

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      // expect(releasableData[0]).to.be.eq(expectAmount);
      expect(releasableData[1]).to.be.eq(BigInt(n));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      const receipt = await vestTx.wait();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);
      const currentCountNext = await bicUnlockTokenV2.currentCount();

      expect(balanceOfNext).to.be.eq(totalAmount);
      expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(n));

      const balanceOfUnlockContract = await testERC20.balanceOf(bicUnlockTokenV2.target);
      expect(balanceOfUnlockContract).to.be.eq(BigInt(0));
    });

  });


  describe("Case with beauty number with remain time", () => {
    const salt = "123";

    const speedRateNumber = 1.8;
    const speedRate = ethers.parseUnits((100 - speedRateNumber).toString(), 3); // 2% / 1_000
    const duration = moment.duration(1, "weeks").asSeconds();
    const totalAmount = ethers.parseUnits("4000", 18);
    const countExpect = BigInt(Math.round((timeSpan * ((100 - speedRateNumber) / 100) / duration)));
    const weeksRemaining = timeSpan * ((100 - speedRateNumber) / 100)

    before(async () => {
      const { wallet2: beneficiary } = await getEOAAccounts();

      const unlockAddress = await bicUnlockFactory.computeUnlock(testERC20.target, totalAmount, beneficiary.address, timeSpan, duration, speedRate, salt);
      const createTx = await bicUnlockFactory.createUnlock(testERC20.target, totalAmount, beneficiary.address, timeSpan, duration, speedRate, salt);
      const receipt = await createTx.wait();

      bicUnlockTokenV2 = await ethers.getContractAt("BicUnlockTokenV2", unlockAddress);

      const balanceOf = await testERC20.balanceOf(unlockAddress);
      expect(balanceOf).to.be.eq(totalAmount);

      bicUnlockTokenV2 = await ethers.getContractAt("BicUnlockTokenV2", unlockAddress);

      const start = await bicUnlockTokenV2.start();
      const end = await bicUnlockTokenV2.end();
      const count = await bicUnlockTokenV2.count();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);
      expect(start).to.be.eq(block?.timestamp);
      expect(end).to.be.eq(start + BigInt(weeksRemaining));
      expect(count).to.be.eq(countExpect);

    });

    it("should not unlock token successfully if not passed duration", async () => {
      const releasableData = await bicUnlockTokenV2["releasable()"]();

      expect(releasableData[0]).to.be.eq(BigInt(0));
      expect(releasableData[1]).to.be.eq(BigInt(0));
      const vestTx = bicUnlockTokenV2.release();
      await expect(vestTx).revertedWith("VestingWallet: no tokens to release");
    });

    it("should unlock token successfully if passed 4 durations", async () => {
      const { wallet2: beneficiary } = await getEOAAccounts();

      const start = await bicUnlockTokenV2.start();
      const currentCount = await bicUnlockTokenV2.currentCount();
      const n = 4; // 4 durations(weeks)
      const expectAmount = BigInt(n) * totalAmount / countExpect;

      const timePassed = start + BigInt(moment.duration(n, "weeks").asSeconds());
      await helpers.time.increaseTo(timePassed);

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      // expect(releasableData[0]).to.be.eq(expectAmount);
      expect(releasableData[1]).to.be.eq(BigInt(n));
      expect(currentCount).to.be.eq(BigInt(0));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      await vestTx.wait();

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);

      expect(balanceOfNext).to.be.eq(balanceOfPrev + releasableData[0]);
    });

    it("should unlock token successfully if passed more(15) durations", async () => {
      const { wallet2: beneficiary } = await getEOAAccounts();

      const count = await bicUnlockTokenV2.count();
      const start = await bicUnlockTokenV2.lastAtCurrentCount();
      const currentCountPrev = await bicUnlockTokenV2.currentCount();
      const n = 15; // 15 durations(weeks)
      const expectAmount = BigInt(n) * totalAmount / count;

      const timePassed = start + BigInt(moment.duration(n, "weeks").asSeconds());
      await helpers.time.increaseTo(timePassed);

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      // expect(releasableData[0]).to.be.eq(expectAmount);
      expect(releasableData[1]).to.be.eq(BigInt(n));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      await vestTx.wait();

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);
      const currentCountNext = await bicUnlockTokenV2.currentCount();

      expect(balanceOfNext).to.be.eq(balanceOfPrev + releasableData[0]);
      expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(n));
    });

    it("should unlock token successfully if passed full durations", async () => {
      const { wallet2: beneficiary } = await getEOAAccounts();

      const amountPerSecond = await bicUnlockTokenV2.amountPerSecond();
      const duration = await bicUnlockTokenV2.duration();
      const count = await bicUnlockTokenV2.count();
      const end = await bicUnlockTokenV2.end();
      const start = await bicUnlockTokenV2.lastAtCurrentCount();
      const currentCountPrev = await bicUnlockTokenV2.currentCount();
      const n = count - currentCountPrev;

      const timePassed = start + BigInt(moment.duration(Number(n), "weeks").asSeconds());
      await helpers.time.increaseTo(timePassed);

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      // expect(releasableData[0]).to.be.eq(expectAmount);
      expect(releasableData[1]).to.be.eq(BigInt(n));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      const receipt = await vestTx.wait();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);
      const currentCountNext = await bicUnlockTokenV2.currentCount();

      expect(balanceOfNext).to.be.eq(balanceOfPrev + duration * n * amountPerSecond);
      expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(n));

      const balanceOfUnlockContract = await testERC20.balanceOf(bicUnlockTokenV2.target);
      const totalAmountRemain = (BigInt(weeksRemaining) - duration * countExpect) * amountPerSecond;
      expect(balanceOfUnlockContract).to.be.greaterThanOrEqual(totalAmountRemain);
    });

    it("should unlock all token successfully if passed end time", async () => {
      const { wallet2: beneficiary } = await getEOAAccounts();

      const count = await bicUnlockTokenV2.count();
      const end = await bicUnlockTokenV2.end();
      const duration = await bicUnlockTokenV2.duration();
      const amountPerSecond = await bicUnlockTokenV2.amountPerSecond();
      const currentCountPrev = await bicUnlockTokenV2.currentCount();
      const n = count - currentCountPrev;

      await helpers.time.increaseTo(end + BigInt(1));

      const releasableData = await bicUnlockTokenV2["releasable()"]();
      const balanceOfUnlockContractPrev = await testERC20.balanceOf(bicUnlockTokenV2.target);


      expect(releasableData[0]).to.be.eq(balanceOfUnlockContractPrev);
      expect(releasableData[1]).to.be.eq(BigInt(n));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);


      const vestTx = await bicUnlockTokenV2.release();
      const receipt = await vestTx.wait();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);
      expect(balanceOfNext).to.be.eq(balanceOfPrev + releasableData[0]);

      
      const currentCountNext = await bicUnlockTokenV2.currentCount();
      expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(n));

      const balanceOfUnlockContractNext = await testERC20.balanceOf(bicUnlockTokenV2.target);
      expect(balanceOfUnlockContractNext).to.be.lessThanOrEqual(BigInt(0));
    });
  });



});
