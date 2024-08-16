import { expect } from "chai";
import { ethers } from "hardhat";
import { PaymentService, TestERC20 } from "../../../typechain-types";
import { getEOAAccounts } from "../util/getEoaAccount";

describe("PaymentService", function () {
  let paymentService: PaymentService;
  let testERC20: TestERC20;

  before(async () => {
    const { wallet1 } = await getEOAAccounts();

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    testERC20 = await TestERC20.deploy();
    await testERC20.waitForDeployment();

    const PaymentService = await ethers.getContractFactory("PaymentService");
    paymentService = await PaymentService.deploy();
    await paymentService.waitForDeployment();

    await testERC20.transfer(wallet1.address, ethers.parseUnits("1000", 18));
  });

  describe("Use string", async () => {
    it("User string: Should tip for other user successfully", async () => {
      const { wallet1 } = await getEOAAccounts();
      const amount = ethers.parseUnits("10", 18);
      const message = {
        msg: "The post is great 你好你好你好你好你好".repeat(100),
        postId: "123123",
      };

      const approveTx = await testERC20.approve(paymentService.target, amount);
      await approveTx.wait();

      const tipTx = await paymentService.tip(
        testERC20.target,
        wallet1.address,
        ethers.parseUnits("10", 18),
        JSON.stringify(message)
      );

      await tipTx.wait();
      await expect(tipTx)
        .to.emit(paymentService, "Tip")
        .to.emit(testERC20, "Transfer");
      const tipReceipt = await tipTx.wait();
      const tipEvent = tipReceipt!.logs
        .map((e) => {
          try {
            const event = paymentService.interface.parseLog(e as any);
            return event;
          } catch (error) {
            return null;
          }
        })
        .filter((e) => e !== null)
        .find((e) => e.name === "Tip");
      const messageEvent = tipEvent?.args.message;
      expect(messageEvent).to.equal(JSON.stringify(message));
    });

    it("User string: Should charge service successfully", async () => {
      const amount = ethers.parseUnits("10", 18);
      const message = {
        msg: "Enable the Extend Community \xf0\x28\x8c\x28".repeat(10000),
        serviceId: "456456",
      };

      const approveTx = await testERC20.approve(paymentService.target, amount);
      await approveTx.wait();

      const chargeTx = await paymentService.charge(
        testERC20.target,
        ethers.parseUnits("10", 18),
        JSON.stringify(message)
      );

      await chargeTx.wait();
      await expect(chargeTx)
        .to.emit(paymentService, "Charge")
        .to.emit(testERC20, "Transfer");
      const chargeReceipt = await chargeTx.wait();
      const chargeEvent = chargeReceipt!.logs
        .map((e) => {
          try {
            const event = paymentService.interface.parseLog(e as any);
            return event;
          } catch (error) {
            return null;
          }
        })
        .filter((e) => e !== null)
        .find((e) => e.name === "Charge");
      const messageEvent = chargeEvent?.args.message;
      expect(messageEvent).to.equal(JSON.stringify(message));
    });

    it("Should admin withdraw token", async () => {
      const { wallet1 } = await getEOAAccounts();
      const balance = await testERC20.balanceOf(paymentService.target);
      const withdrawTx = await paymentService.withdrawToken(
        testERC20.target,
        wallet1.address,
        balance
      );
      const withdrawReceipt = withdrawTx.wait();
      await expect(withdrawReceipt).to.emit(testERC20, "Transfer");
    });
  });

  describe("Use bytes", async () => {
    it("User bytes: Should tip for other user successfully", async () => {
      const { wallet1 } = await getEOAAccounts();
      const amount = ethers.parseUnits("10", 18);
      const message = {
        msg: "The post is great 你好你好你好你好你好".repeat(100),
        postId: "123123",
      };

      const approveTx = await testERC20.approve(paymentService.target, amount);
      await approveTx.wait();

      const tipTx = await paymentService.tipWithBytesMessage(
        testERC20.target,
        wallet1.address,
        ethers.parseUnits("10", 18),
        ethers.toUtf8Bytes(JSON.stringify(message))
      );

      await tipTx.wait();
      await expect(tipTx)
        .to.emit(paymentService, "TipWithBytesMessage")
        .to.emit(testERC20, "Transfer");
      const tipReceipt = await tipTx.wait();
      const tipEvent = tipReceipt!.logs
        .map((e) => {
          try {
            const event = paymentService.interface.parseLog(e as any);
            return event;
          } catch (error) {
            return null;
          }
        })
        .filter((e) => e !== null)
        .find((e) => e.name === "TipWithBytesMessage");
      const messageEvent = tipEvent?.args.message;
      expect(ethers.toUtf8String(messageEvent)).to.equal(
        JSON.stringify(message)
      );
    });

    it("User bytes: Should charge service successfully", async () => {
      const amount = ethers.parseUnits("10", 18);
      const message = {
        msg: "Enable the Extend Community \xf0\x28\x8c\x28".repeat(10000),
        serviceId: "456456",
      };

      const approveTx = await testERC20.approve(paymentService.target, amount);
      await approveTx.wait();

      const chargeTx = await paymentService.chargeWithBytesMessage(
        testERC20.target,
        ethers.parseUnits("10", 18),
        ethers.toUtf8Bytes(JSON.stringify(message))
      );

      await chargeTx.wait();
      await expect(chargeTx)
        .to.emit(paymentService, "ChargeWithBytesMessage")
        .to.emit(testERC20, "Transfer");
      const chargeReceipt = await chargeTx.wait();
      const chargeEvent = chargeReceipt!.logs
        .map((e) => {
          try {
            const event = paymentService.interface.parseLog(e as any);
            return event;
          } catch (error) {
            return null;
          }
        })
        .filter((e) => e !== null)
        .find((e) => e.name === "ChargeWithBytesMessage");
      const messageEvent = chargeEvent?.args.message;
      expect(ethers.toUtf8String(messageEvent)).to.equal(
        JSON.stringify(message)
      );
    });
  });
});
