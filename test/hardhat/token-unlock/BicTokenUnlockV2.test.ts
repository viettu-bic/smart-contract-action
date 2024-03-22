
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
  const bufferCount = (p: number) => {
    return P_DECIMALS % p > 0 ? 1 : 0;
  }

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
    const beneficiary = ethers.Wallet.createRandom(ethers.provider);
    it("should create unlock successfully with beauty", async () => {
      const salt = moment().unix().toString();
      const speedRateNumber = ethers.toBigInt(ethers.parseUnits("2".toString(), 3));
      const duration = moment.duration(1, "weeks").asSeconds();
      const totalAmount = ethers.parseUnits("4000", 18);
      const countExpect = BigInt(Math.floor(P_DECIMALS / Number(speedRateNumber)));
      const totalDurations = (countExpect + BigInt(bufferCount(Number(speedRateNumber)))) * BigInt(duration);



      const unlockAddress = await bicUnlockFactory.computeUnlock(testERC20.target, totalAmount, beneficiary.address, duration, speedRateNumber, salt);
      const createTx = await bicUnlockFactory.createUnlock(testERC20.target, totalAmount, beneficiary.address, duration, speedRateNumber, salt);
      const receipt = await createTx.wait();

      bicUnlockTokenV2 = await ethers.getContractAt("BicUnlockTokenV2", unlockAddress);

      const start = await bicUnlockTokenV2.start();
      const end = await bicUnlockTokenV2.end();
      const count = await bicUnlockTokenV2.count();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

      expect(start).to.be.eq(block?.timestamp);
      expect(end).to.be.eq(start + totalDurations);
      expect(count).to.be.eq(countExpect);

      const amountPerDuration = await bicUnlockTokenV2.amountPerDuration();
      expect(amountPerDuration).to.be.eq(BigInt(Number(totalAmount) * Number(speedRateNumber) / P_DECIMALS));

      const balanceOfUnlockContract = await testERC20.balanceOf(bicUnlockTokenV2.target);
      expect(balanceOfUnlockContract).to.lessThanOrEqual(totalAmount);
    });

    it("should create unlock successfully with odd number", async () => {
      const salt = moment().unix().toString();
      const speedRateNumber = ethers.toBigInt(ethers.parseUnits("1.43".toString(), 3));
      const duration = moment.duration(1, "weeks").asSeconds();
      const totalAmount = ethers.parseUnits("2000", 18);
      const countExpect = BigInt(Math.floor(P_DECIMALS / Number(speedRateNumber)));
      const totalDurations = (countExpect + BigInt(bufferCount(Number(speedRateNumber)))) * BigInt(duration);



      const unlockAddress = await bicUnlockFactory.computeUnlock(testERC20.target, totalAmount, beneficiary.address, duration, speedRateNumber, salt);
      const createTx = await bicUnlockFactory.createUnlock(testERC20.target, totalAmount, beneficiary.address, duration, speedRateNumber, salt);
      const receipt = await createTx.wait();

      bicUnlockTokenV2 = await ethers.getContractAt("BicUnlockTokenV2", unlockAddress);

      const start = await bicUnlockTokenV2.start();
      const end = await bicUnlockTokenV2.end();
      const count = await bicUnlockTokenV2.count();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

      expect(start).to.be.eq(block?.timestamp);
      expect(end).to.be.eq(start + totalDurations);
      expect(count).to.be.eq(countExpect);

      const amountPerDuration = await bicUnlockTokenV2.amountPerDuration();
      expect(amountPerDuration).to.be.eq(BigInt(Number(totalAmount) * Number(speedRateNumber) / P_DECIMALS));


      const balanceOfUnlockContract = await testERC20.balanceOf(bicUnlockTokenV2.target);
      expect(balanceOfUnlockContract).to.lessThanOrEqual(totalAmount);
    });
  });

  describe("Bic Unlock contract", () => {

    describe("Test with beauty number", async () => {
      const beneficiary = ethers.Wallet.createRandom(ethers.provider);
      const duration = moment.duration(1, "weeks").asSeconds();
      const salt = moment().unix().toString();
      const speedRateNumber = ethers.toBigInt(ethers.parseUnits("0.5".toString(), 3));
      const totalAmount = "2000";
      const totalAmountInDecimal = ethers.parseUnits(totalAmount, 18);
      const countExpect = BigInt(Math.floor(P_DECIMALS / Number(speedRateNumber)));
      const totalDurations = (countExpect + BigInt(bufferCount(Number(speedRateNumber)))) * BigInt(duration);

      before(async () => {
        const unlockAddress = await bicUnlockFactory.computeUnlock(testERC20.target, totalAmountInDecimal, beneficiary.address, duration, speedRateNumber, salt);
        const createTx = await bicUnlockFactory.createUnlock(testERC20.target, totalAmountInDecimal, beneficiary.address, duration, speedRateNumber, salt);
        const receipt = await createTx.wait();

        bicUnlockTokenV2 = await ethers.getContractAt("BicUnlockTokenV2", unlockAddress);

        const start = await bicUnlockTokenV2.start();
        const end = await bicUnlockTokenV2.end();
        const count = await bicUnlockTokenV2.count();
        const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

        expect(start).to.be.eq(block?.timestamp);
        expect(end).to.be.eq(start + totalDurations);
        expect(count).to.be.eq(countExpect);


        const amountPerDuration = await bicUnlockTokenV2.amountPerDuration();
        const amountPerDurationExpect = BigInt(ethers.parseUnits(String(Number(totalAmount) * Number(speedRateNumber) / P_DECIMALS), 18));
        expect(amountPerDuration).to.be.eq(amountPerDurationExpect);

        const balanceOfUnlockContract = await testERC20.balanceOf(bicUnlockTokenV2.target);
        expect(balanceOfUnlockContract).to.eq(ethers.toBigInt(totalAmountInDecimal));
      });

      it("should not unlock if not passed durations", async () => {
        const releasableData = await bicUnlockTokenV2.releasable();
        expect(releasableData[0]).to.be.eq(BigInt(0));
        expect(releasableData[1]).to.be.eq(BigInt(0));
        const vestTx = bicUnlockTokenV2.release();
        await expect(vestTx).revertedWith("VestingWallet: no tokens to release");
      });

      it("should unlock if passed 4 durations", async () => {
        const passedDuration = 4;
        const lastAtCurrentCountPrev = await bicUnlockTokenV2.lastAtCurrentCount();
        const amountPerDuration = await bicUnlockTokenV2.amountPerDuration();


        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const timePassed = lastAtCurrentCountPrev + BigInt(moment.duration(passedDuration, "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed + BigInt(1));

        const releasableData = await bicUnlockTokenV2.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentCountPrev = await bicUnlockTokenV2.currentCount();
        const beneficiaryBalancePrev = await testERC20.balanceOf(beneficiary.address);

        const vestTx = bicUnlockTokenV2.release();
        await expect(vestTx).emit(bicUnlockTokenV2, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(beneficiary.address);
        expect(beneficiaryBalanceNext).to.be.eq(beneficiaryBalancePrev + amountExpect);

        const currentCountNext = await bicUnlockTokenV2.currentCount();
        expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(passedDuration));

        const lastAtCurrentCountNext = await bicUnlockTokenV2.lastAtCurrentCount();
        expect(lastAtCurrentCountNext).to.be.eq(lastAtCurrentCountPrev + BigInt(passedDuration) * BigInt(duration));
      });

      it("should unlock if passed fully durations", async () => {
        const lastAtCurrentCountPrev = await bicUnlockTokenV2.lastAtCurrentCount();
        const amountPerDuration = await bicUnlockTokenV2.amountPerDuration();
        const count = await bicUnlockTokenV2.count();
        const currentCount = await bicUnlockTokenV2.currentCount();

        const passedDuration = count - currentCount;


        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const amountRemainExpect = ethers.toBigInt(totalAmountInDecimal) - amountPerDuration * countExpect;
        
        const timePassed = lastAtCurrentCountPrev + BigInt(moment.duration(Number(passedDuration), "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed);

        const releasableData = await bicUnlockTokenV2.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentCountPrev = await bicUnlockTokenV2.currentCount();
        const beneficiaryBalancePrev = await testERC20.balanceOf(beneficiary.address);

        const vestTx = bicUnlockTokenV2.release();
        await expect(vestTx).emit(bicUnlockTokenV2, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(beneficiary.address);
        expect(beneficiaryBalanceNext).to.be.eq(beneficiaryBalancePrev + amountExpect);

        const currentCountNext = await bicUnlockTokenV2.currentCount();
        expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(passedDuration));

        const unlockContractBalanceNext = await testERC20.balanceOf(bicUnlockTokenV2.target);
        expect(unlockContractBalanceNext).to.be.eq(amountRemainExpect);
        
        const lastAtCurrentCountNext = await bicUnlockTokenV2.lastAtCurrentCount();
        expect(lastAtCurrentCountNext).to.be.eq(lastAtCurrentCountPrev + BigInt(passedDuration) * BigInt(duration));
      });

    });


    describe("Test with odd number", async () => {
      const beneficiary = ethers.Wallet.createRandom(ethers.provider);
      const duration = moment.duration(1, "weeks").asSeconds();
      const salt = moment().unix().toString();
      const speedRateNumber = ethers.toBigInt(ethers.parseUnits("1.3".toString(), 3));

      const totalAmount = "3333.37";
      const totalAmountInDecimal = ethers.parseUnits(totalAmount, 18);

      const countExpect = BigInt(Math.floor(P_DECIMALS / Number(speedRateNumber)));
      const totalDurations = (countExpect + BigInt(bufferCount(Number(speedRateNumber)))) * BigInt(duration);

      before(async () => {
        const unlockAddress = await bicUnlockFactory.computeUnlock(testERC20.target, totalAmountInDecimal, beneficiary.address, duration, speedRateNumber, salt);
        const createTx = await bicUnlockFactory.createUnlock(testERC20.target, totalAmountInDecimal, beneficiary.address, duration, speedRateNumber, salt);
        const receipt = await createTx.wait();

        bicUnlockTokenV2 = await ethers.getContractAt("BicUnlockTokenV2", unlockAddress);

        const start = await bicUnlockTokenV2.start();
        const end = await bicUnlockTokenV2.end();
        const count = await bicUnlockTokenV2.count();
        const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

        expect(start).to.be.eq(block?.timestamp);
        expect(end).to.be.eq(start + totalDurations);
        expect(count).to.be.eq(countExpect);


        const amountPerDuration = await bicUnlockTokenV2.amountPerDuration();
        const amountPerDurationExpect = BigInt(ethers.parseUnits(String(Number(totalAmount) * Number(speedRateNumber) / P_DECIMALS), 18));
        expect(amountPerDuration).to.be.eq(amountPerDurationExpect);

        const balanceOfUnlockContract = await testERC20.balanceOf(bicUnlockTokenV2.target);
        expect(balanceOfUnlockContract).to.lessThanOrEqual(ethers.toBigInt(totalAmountInDecimal));
      });

      it("should not unlock if not passed durations", async () => {
        const releasableData = await bicUnlockTokenV2.releasable();
        expect(releasableData[0]).to.be.eq(BigInt(0));
        expect(releasableData[1]).to.be.eq(BigInt(0));
        const vestTx = bicUnlockTokenV2.release();
        await expect(vestTx).revertedWith("VestingWallet: no tokens to release");
      });

      it("should unlock if passed 4 durations", async () => {
        const passedDuration = 4;
        const lastAtCurrentCountPrev = await bicUnlockTokenV2.lastAtCurrentCount();
        const amountPerDuration = await bicUnlockTokenV2.amountPerDuration();


        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const timePassed = lastAtCurrentCountPrev + BigInt(moment.duration(passedDuration, "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed + BigInt(1));

        const releasableData = await bicUnlockTokenV2.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentCountPrev = await bicUnlockTokenV2.currentCount();
        const beneficiaryBalancePrev = await testERC20.balanceOf(beneficiary.address);

        const vestTx = bicUnlockTokenV2.release();
        await expect(vestTx).emit(bicUnlockTokenV2, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(beneficiary.address);
        expect(beneficiaryBalanceNext).to.be.eq(beneficiaryBalancePrev + amountExpect);

        const currentCountNext = await bicUnlockTokenV2.currentCount();
        expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(passedDuration));

        const lastAtCurrentCountNext = await bicUnlockTokenV2.lastAtCurrentCount();
        expect(lastAtCurrentCountNext).to.be.eq(lastAtCurrentCountPrev + BigInt(passedDuration) * BigInt(duration));
      });

      it("should unlock if passed fully durations", async () => {
        const lastAtCurrentCountPrev = await bicUnlockTokenV2.lastAtCurrentCount();
        const amountPerDuration = await bicUnlockTokenV2.amountPerDuration();
        const count = await bicUnlockTokenV2.count();
        const currentCount = await bicUnlockTokenV2.currentCount();

        const passedDuration = count - currentCount;


        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const amountRemainExpect = ethers.toBigInt(totalAmountInDecimal) - amountPerDuration * countExpect;
        
        const timePassed = lastAtCurrentCountPrev + BigInt(moment.duration(Number(passedDuration), "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed);

        const releasableData = await bicUnlockTokenV2.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentCountPrev = await bicUnlockTokenV2.currentCount();
        const beneficiaryBalancePrev = await testERC20.balanceOf(beneficiary.address);

        const vestTx = bicUnlockTokenV2.release();
        await expect(vestTx).emit(bicUnlockTokenV2, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(beneficiary.address);
        expect(beneficiaryBalanceNext).to.be.eq(beneficiaryBalancePrev + amountExpect);

        const currentCountNext = await bicUnlockTokenV2.currentCount();
        expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(passedDuration));

        const unlockContractBalanceNext = await testERC20.balanceOf(bicUnlockTokenV2.target);
        expect(unlockContractBalanceNext).to.be.eq(amountRemainExpect);
        
        const lastAtCurrentCountNext = await bicUnlockTokenV2.lastAtCurrentCount();
        expect(lastAtCurrentCountNext).to.be.eq(lastAtCurrentCountPrev + BigInt(passedDuration) * BigInt(duration));
      });

      it("should unlock remain amount if passed end time", async () => {
        const lastAtCurrentCountPrev = await bicUnlockTokenV2.lastAtCurrentCount();
        const amountPerDuration = await bicUnlockTokenV2.amountPerDuration();
        const end = await bicUnlockTokenV2.end();
        const count = await bicUnlockTokenV2.count();
        const currentCount = await bicUnlockTokenV2.currentCount();

        const passedDuration = count - currentCount;


        const amountRemainExpect = ethers.toBigInt(totalAmountInDecimal) - amountPerDuration * countExpect;
        
        await helpers.time.increaseTo(end + BigInt(1));

        const releasableData = await bicUnlockTokenV2.releasable();
        expect(releasableData[0]).to.be.greaterThanOrEqual(amountRemainExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentCountPrev = await bicUnlockTokenV2.currentCount();
        const beneficiaryBalancePrev = await testERC20.balanceOf(beneficiary.address);

        const vestTx = bicUnlockTokenV2.release();
        await expect(vestTx).emit(bicUnlockTokenV2, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(beneficiary.address);
        expect(beneficiaryBalanceNext).to.be.eq(beneficiaryBalancePrev + amountRemainExpect);

        const currentCountNext = await bicUnlockTokenV2.currentCount();
        expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(passedDuration));

        const unlockContractBalanceNext = await testERC20.balanceOf(bicUnlockTokenV2.target);
        expect(unlockContractBalanceNext).to.be.eq(BigInt(0));
        
        const lastAtCurrentCountNext = await bicUnlockTokenV2.lastAtCurrentCount();
        expect(lastAtCurrentCountNext).to.be.eq(lastAtCurrentCountPrev + BigInt(passedDuration) * BigInt(duration));
      });
    })
  });


});
