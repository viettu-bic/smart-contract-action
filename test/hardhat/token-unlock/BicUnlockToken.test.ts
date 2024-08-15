import { expect } from "chai";
import { ethers } from "hardhat";
import dayjs from "dayjs";
import dayDurationPlugin from "dayjs/plugin/duration";
dayjs.extend(dayDurationPlugin);
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import {
  BicRedeemFactory,
  BicRedeemToken,
  TestERC20,
} from "../../../typechain-types";

describe("BicRedeemToken Test", function () {
  let bicRedeemToken: BicRedeemToken;
  let bicRedeemFactory: BicRedeemFactory;
  let testERC20: TestERC20;

  const DENOMINATOR = 10_000;
  const bufferStack = (p: number) => {
    return DENOMINATOR % p > 0 ? 1 : 0;
  };

  before(async () => {
    const BicRedeemFactory = await ethers.getContractFactory(
      "BicRedeemFactory"
    );
    bicRedeemFactory = await BicRedeemFactory.deploy();
    await bicRedeemFactory.waitForDeployment();
    const bicRedeemImplementation =
      await bicRedeemFactory.bicRedeemImplementation();

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    testERC20 = await TestERC20.deploy();
    await testERC20.waitForDeployment();
  });

  describe("Bic Redeem factory", () => {
    it("should create redeem successfully with beauty", async () => {
      const beneficiary = ethers.Wallet.createRandom(ethers.provider);
      const speedRateNumber = ethers.toBigInt(
        ethers.parseUnits("2".toString(), 3)
      );

      const duration = dayjs.duration(1, "weeks").asSeconds();
      const totalAmount = ethers.parseUnits("4000", 18);
      await testERC20.transfer(bicRedeemFactory.target as any ,totalAmount as any);
      const stacksExpect = BigInt(
        Math.floor(DENOMINATOR / Number(speedRateNumber))
      );
      const totalDurations =
        (stacksExpect + BigInt(bufferStack(Number(speedRateNumber)))) *
        BigInt(duration);

      const redeemAddress = await bicRedeemFactory.computeRedeem(
        testERC20.target,
        totalAmount,
        beneficiary.address,
        duration,
        speedRateNumber,
      );
      const createTx = await bicRedeemFactory.createRedeem(
        testERC20.target,
        totalAmount,
        beneficiary.address,
        duration,
        speedRateNumber,
      );
      const receipt = await createTx.wait();

      bicRedeemToken = await ethers.getContractAt(
        "BicRedeemToken",
        redeemAddress
      );

      const start = await bicRedeemToken.start();
      const end = await bicRedeemToken.end();
      const maxRewardStacks = await bicRedeemToken.maxRewardStacks();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

      expect(start).to.be.eq(block?.timestamp);
      expect(end).to.be.eq(start + totalDurations);
      expect(maxRewardStacks).to.be.eq(stacksExpect);

      const amountPerDuration = await bicRedeemToken.amountPerDuration();
      expect(amountPerDuration).to.be.eq(
        BigInt((Number(totalAmount) * Number(speedRateNumber)) / DENOMINATOR)
      );

      const balanceOfRedeemContract = await testERC20.balanceOf(
        bicRedeemToken.target
      );
      expect(balanceOfRedeemContract).to.lessThanOrEqual(totalAmount);
    });

    it("should create redeem successfully with odd number", async () => {
      const beneficiary = ethers.Wallet.createRandom(ethers.provider);
      const speedRateNumber = ethers.toBigInt(
        ethers.parseUnits("1.43".toString(), 3)
      );
      const duration = dayjs.duration(1, "weeks").asSeconds();
      const totalAmount = ethers.parseUnits("2000", 18);
      await testERC20.transfer(bicRedeemFactory.target as any ,totalAmount as any);
      const stacksExpect = BigInt(
        Math.floor(DENOMINATOR / Number(speedRateNumber))
      );
      const totalDurations =
        (stacksExpect + BigInt(bufferStack(Number(speedRateNumber)))) *
        BigInt(duration);

      const redeemAddress = await bicRedeemFactory.computeRedeem(
        testERC20.target,
        totalAmount,
        beneficiary.address,
        duration,
        speedRateNumber,
      );
      const createTx = await bicRedeemFactory.createRedeem(
        testERC20.target,
        totalAmount,
        beneficiary.address,
        duration,
        speedRateNumber,
      );
      const receipt = await createTx.wait();

      bicRedeemToken = await ethers.getContractAt(
        "BicRedeemToken",
        redeemAddress
      );

      const start = await bicRedeemToken.start();
      const end = await bicRedeemToken.end();
      const maxRewardStacks = await bicRedeemToken.maxRewardStacks();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

      expect(start).to.be.eq(block?.timestamp);
      expect(end).to.be.eq(start + totalDurations);
      expect(maxRewardStacks).to.be.eq(stacksExpect);

      const amountPerDuration = await bicRedeemToken.amountPerDuration();
      expect(amountPerDuration).to.be.eq(
        BigInt((Number(totalAmount) * Number(speedRateNumber)) / DENOMINATOR)
      );

      const balanceOfRedeemContract = await testERC20.balanceOf(
        bicRedeemToken.target
      );
      expect(balanceOfRedeemContract).to.lessThanOrEqual(totalAmount);
    });
  });

  describe("Bic Redeem contract", () => {
    describe("Test with beauty number", async () => {
      const beneficiary = ethers.Wallet.createRandom(ethers.provider);
      const duration = dayjs.duration(1, "weeks").asSeconds();
      const speedRateNumber = ethers.toBigInt(
        ethers.parseUnits("0.5".toString(), 3)
      );
      const totalAmount = "3000";
      const totalAmountInDecimal = ethers.parseUnits(totalAmount, 18);

      const stacksExpect = BigInt(
        Math.floor(DENOMINATOR / Number(speedRateNumber))
      );
      const totalDurations =
        (stacksExpect + BigInt(bufferStack(Number(speedRateNumber)))) *
        BigInt(duration);

      before(async () => {
        await testERC20.transfer(bicRedeemFactory.target as any ,totalAmountInDecimal as any);

        const redeemAddress = await bicRedeemFactory.computeRedeem(
          testERC20.target,
          totalAmountInDecimal,
          beneficiary.address,
          duration,
          speedRateNumber,
        );
        const createTx = await bicRedeemFactory.createRedeem(
          testERC20.target,
          totalAmountInDecimal,
          beneficiary.address,
          duration,
          speedRateNumber,
        );
        const receipt = await createTx.wait();

        bicRedeemToken = await ethers.getContractAt(
          "BicRedeemToken",
          redeemAddress
        );

        const start = await bicRedeemToken.start();
        const end = await bicRedeemToken.end();
        const maxRewardStacks = await bicRedeemToken.maxRewardStacks();
        const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

        expect(start).to.be.eq(block?.timestamp);
        expect(end).to.be.eq(start + totalDurations);
        expect(maxRewardStacks).to.be.eq(stacksExpect);

        const amountPerDuration = await bicRedeemToken.amountPerDuration();
        const amountPerDurationExpect = BigInt(
          ethers.parseUnits(
            String(
              (Number(totalAmount) * Number(speedRateNumber)) / DENOMINATOR
            ),
            18
          )
        );
        expect(amountPerDuration).to.be.eq(amountPerDurationExpect);

        const balanceOfRedeemContract = await testERC20.balanceOf(
          bicRedeemToken.target
        );
        expect(balanceOfRedeemContract).to.eq(
          ethers.toBigInt(totalAmountInDecimal)
        );
      });

      it("should not redeem if not passed durations", async () => {
        const releasableData = await bicRedeemToken.releasable();
        expect(releasableData[0]).to.be.eq(BigInt(0));
        expect(releasableData[1]).to.be.eq(BigInt(0));
        const vestTx = bicRedeemToken.release();
        await expect(vestTx).revertedWith(
          "VestingWallet: no tokens to release"
        );
      });

      it("should redeem if passed 4 durations", async () => {
        const passedDuration = 4;
        const lastAtCurrentRewardStacksPrev =
          await bicRedeemToken.lastAtCurrentStack();
        const amountPerDuration = await bicRedeemToken.amountPerDuration();
        const beneficiary = await bicRedeemToken.beneficiary();


        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const timePassed =
          lastAtCurrentRewardStacksPrev +
          BigInt(dayjs.duration(passedDuration, "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed + BigInt(1));

        const releasableData = await bicRedeemToken.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicRedeemToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary
        );

        const vestTx = bicRedeemToken.release();
        await expect(vestTx)
          .emit(bicRedeemToken, "ERC20Released")
          .emit(testERC20, "Transfer");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountExpect
        );

        const currentRewardStacksNext = await bicRedeemToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const lastAtcurrentRewardStacksNext =
          await bicRedeemToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });

      it("should redeem if passed more 4 durations", async () => {
        const passedDuration = 4;
        const lastAtCurrentRewardStacksPrev =
          await bicRedeemToken.lastAtCurrentStack();
        const amountPerDuration = await bicRedeemToken.amountPerDuration();
        const beneficiary = await bicRedeemToken.beneficiary();


        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const timePassed =
          lastAtCurrentRewardStacksPrev +
          BigInt(dayjs.duration(passedDuration, "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed + BigInt(1));

        const releasableData = await bicRedeemToken.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicRedeemToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary
        );

        const vestTx = bicRedeemToken.release();
        await expect(vestTx)
          .emit(bicRedeemToken, "ERC20Released")
          .emit(testERC20, "Transfer");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountExpect
        );

        const currentRewardStacksNext = await bicRedeemToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const lastAtcurrentRewardStacksNext =
          await bicRedeemToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });

      it("should trace log with 2 claim times", async () => {
        const startBlock = 1; // The block number to start searching for events
        const endBlock = "latest";
        const filter = bicRedeemToken.filters.ERC20Released();
        console.log("🚀 ~ it ~ filter:", filter.fragment)
        const events = await bicRedeemToken.queryFilter(filter, startBlock, endBlock);
        const released = events.map((event) => {
          return event.args;
        })
        console.log("🚀 ~ released ~ released:", released)
        expect(events.length).to.be.eq(2);
      });

      it("should redeem if passed fully durations", async () => {
        const lastAtCurrentRewardStacksPrev =
          await bicRedeemToken.lastAtCurrentStack();
        const amountPerDuration = await bicRedeemToken.amountPerDuration();
        const maxRewardStacks = await bicRedeemToken.maxRewardStacks();
        const currentRewardStacks = await bicRedeemToken.currentRewardStacks();

        const passedDuration = maxRewardStacks - currentRewardStacks;

        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const amountRemainExpect =
          ethers.toBigInt(totalAmountInDecimal) -
          amountPerDuration * stacksExpect;

        const timePassed =
          lastAtCurrentRewardStacksPrev +
          BigInt(dayjs.duration(Number(passedDuration), "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed);

        const releasableData = await bicRedeemToken.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicRedeemToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary.address
        );

        const vestTx = bicRedeemToken.release();
        await expect(vestTx).emit(bicRedeemToken, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary.address
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountExpect
        );

        const currentRewardStacksNext = await bicRedeemToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const redeemContractBalanceNext = await testERC20.balanceOf(
          bicRedeemToken.target
        );
        expect(redeemContractBalanceNext).to.be.eq(amountRemainExpect);

        const lastAtcurrentRewardStacksNext =
          await bicRedeemToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });
    });

    describe("Test with odd number", async () => {
      const beneficiary = ethers.Wallet.createRandom(ethers.provider);
      const duration = dayjs.duration(1, "weeks").asSeconds();
      const speedRateNumber = ethers.toBigInt(
        ethers.parseUnits("1.5".toString(), 3)
      );

      const totalAmount = "3333";
      const totalAmountInDecimal = ethers.parseUnits(totalAmount, 18);

      const stacksExpect = BigInt(
        Math.floor(DENOMINATOR / Number(speedRateNumber))
      );
      const totalDurations =
        (stacksExpect + BigInt(bufferStack(Number(speedRateNumber)))) *
        BigInt(duration);

      before(async () => {
        await testERC20.transfer(bicRedeemFactory.target as any ,totalAmountInDecimal as any);
        const redeemAddress = await bicRedeemFactory.computeRedeem(
          testERC20.target,
          totalAmountInDecimal,
          beneficiary.address,
          duration,
          speedRateNumber,
        );
        const createTx = await bicRedeemFactory.createRedeem(
          testERC20.target,
          totalAmountInDecimal,
          beneficiary.address,
          duration,
          speedRateNumber,
        );
        const receipt = await createTx.wait();

        bicRedeemToken = await ethers.getContractAt(
          "BicRedeemToken",
          redeemAddress
        );

        const start = await bicRedeemToken.start();
        const end = await bicRedeemToken.end();
        const maxRewardStacks = await bicRedeemToken.maxRewardStacks();
        const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

        expect(start).to.be.eq(block?.timestamp);
        expect(end).to.be.eq(start + totalDurations);
        expect(maxRewardStacks).to.be.eq(stacksExpect);

        const amountPerDuration = await bicRedeemToken.amountPerDuration();
        const amountPerDurationExpect = ethers.toBigInt(
          ethers.parseUnits(
            String(
              (Number(totalAmount) * Number(speedRateNumber)) / DENOMINATOR
            ),
            18
          )
        );

        expect(amountPerDuration).to.be.eq(amountPerDurationExpect);

        const balanceOfRedeemContract = await testERC20.balanceOf(
          bicRedeemToken.target
        );
        expect(balanceOfRedeemContract).to.lessThanOrEqual(
          ethers.toBigInt(totalAmountInDecimal)
        );
      });

      it("should not redeem if not passed durations", async () => {
        const releasableData = await bicRedeemToken.releasable();
        expect(releasableData[0]).to.be.eq(BigInt(0));
        expect(releasableData[1]).to.be.eq(BigInt(0));
        const vestTx = bicRedeemToken.release();
        await expect(vestTx).revertedWith(
          "VestingWallet: no tokens to release"
        );
      });

      it("should redeem if passed 4 durations", async () => {
        const passedDuration = 4;
        const lastAtCurrentRewardStacksPrev =
          await bicRedeemToken.lastAtCurrentStack();
        const amountPerDuration = await bicRedeemToken.amountPerDuration();
        const beneficiary = await bicRedeemToken.beneficiary();

        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const timePassed =
          lastAtCurrentRewardStacksPrev +
          BigInt(dayjs.duration(passedDuration, "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed + BigInt(1));

        const releasableData = await bicRedeemToken.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicRedeemToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary
        );

        const vestTx = bicRedeemToken.release();
        await expect(vestTx).emit(bicRedeemToken, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountExpect
        );

        const currentRewardStacksNext = await bicRedeemToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const lastAtcurrentRewardStacksNext =
          await bicRedeemToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });

      it("should redeem if passed fully durations", async () => {
        const lastAtCurrentRewardStacksPrev =
          await bicRedeemToken.lastAtCurrentStack();
        const amountPerDuration = await bicRedeemToken.amountPerDuration();
        const maxRewardStacks = await bicRedeemToken.maxRewardStacks();
        const currentRewardStacks = await bicRedeemToken.currentRewardStacks();

        const passedDuration = maxRewardStacks - currentRewardStacks;

        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const amountRemainExpect =
          ethers.toBigInt(totalAmountInDecimal) -
          amountPerDuration * stacksExpect;

        const timePassed =
          lastAtCurrentRewardStacksPrev +
          BigInt(dayjs.duration(Number(passedDuration), "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed);

        const releasableData = await bicRedeemToken.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicRedeemToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary.address
        );

        const vestTx = bicRedeemToken.release();
        await expect(vestTx).emit(bicRedeemToken, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary.address
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountExpect
        );

        const currentRewardStacksNext = await bicRedeemToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const redeemContractBalanceNext = await testERC20.balanceOf(
          bicRedeemToken.target
        );
        expect(redeemContractBalanceNext).to.be.eq(amountRemainExpect);

        const lastAtcurrentRewardStacksNext =
          await bicRedeemToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });

      it("should redeem remain amount if passed end time", async () => {
        const lastAtCurrentRewardStacksPrev =
          await bicRedeemToken.lastAtCurrentStack();
        const amountPerDuration = await bicRedeemToken.amountPerDuration();
        const end = await bicRedeemToken.end();
        const maxRewardStacks = await bicRedeemToken.maxRewardStacks();
        const currentRewardStacks = await bicRedeemToken.currentRewardStacks();

        const passedDuration = maxRewardStacks - currentRewardStacks;

        const amountRemainExpect =
          ethers.toBigInt(totalAmountInDecimal) -
          amountPerDuration * stacksExpect;

        await helpers.time.increaseTo(end + BigInt(1));

        const releasableData = await bicRedeemToken.releasable();
        expect(releasableData[0]).to.be.greaterThanOrEqual(amountRemainExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicRedeemToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary.address
        );

        const vestTx = bicRedeemToken.release();
        await expect(vestTx).emit(bicRedeemToken, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary.address
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountRemainExpect
        );

        const currentRewardStacksNext = await bicRedeemToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const redeemContractBalanceNext = await testERC20.balanceOf(
          bicRedeemToken.target
        );
        expect(redeemContractBalanceNext).to.be.eq(BigInt(0));

        const lastAtcurrentRewardStacksNext =
          await bicRedeemToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });
    });
  });
});
