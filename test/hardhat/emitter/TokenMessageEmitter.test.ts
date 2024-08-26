import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenMessageEmitter, TestERC20 } from "../../../typechain-types";
import { getEOAAccounts } from "../util/getEoaAccount";

describe("TokenMessageEmitter", function () {
  let tokenMessageEmitter: TokenMessageEmitter;
  let testERC20: TestERC20;

  before(async () => {
    const { wallet1 } = await getEOAAccounts();

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    testERC20 = await TestERC20.deploy();
    await testERC20.waitForDeployment();

    const TokenMessageEmitter = await ethers.getContractFactory("TokenMessageEmitter");
    tokenMessageEmitter = await TokenMessageEmitter.deploy();
    await tokenMessageEmitter.waitForDeployment();

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

      const approveTx = await testERC20.approve(tokenMessageEmitter.target, amount);
      await approveTx.wait();

      const tipTx = await tokenMessageEmitter.transferERC20(
        testERC20.target,
        wallet1.address,
        ethers.parseUnits("10", 18),
        JSON.stringify(message)
      );

      await tipTx.wait();
      await expect(tipTx)
        .to.emit(tokenMessageEmitter, "ERC20Message")
        .to.emit(testERC20, "Transfer");
      const tipReceipt = await tipTx.wait();
      const tipEvent = tipReceipt!.logs
        .map((e) => {
          try {
            const event = tokenMessageEmitter.interface.parseLog(e as any);
            return event;
          } catch (error) {
            return null;
          }
        })
        .filter((e) => e !== null)
        .find((e) => e.name === "Tip");
      const messageEvent = tipEvent?.args.message;
      // expect(messageEvent).to.equal(JSON.stringify(message));
    });

    it("User string: Should charge service successfully", async () => {
      const amount = ethers.parseUnits("10", 18);
      const message = {
        msg: "Enable the Extend Community 你好你好你好你好你好 \xf0 你好你好你好你好你好\x28\x8c\x28".repeat(5000),
        serviceId: "456456",
      };

      const approveTx = await testERC20.approve(tokenMessageEmitter.target, amount);
      await approveTx.wait();

      const chargeTx = await tokenMessageEmitter.charge(
        testERC20.target,
        ethers.parseUnits("10", 18),
        JSON.stringify(message)
      );

      await chargeTx.wait();
      await expect(chargeTx)
        .to.emit(tokenMessageEmitter, "ERC20Charge")
        .to.emit(testERC20, "Transfer");
      const chargeReceipt = await chargeTx.wait();
      const chargeEvent = chargeReceipt!.logs
        .map((e) => {
          try {
            const event = tokenMessageEmitter.interface.parseLog(e as any);
            return event;
          } catch (error) {
            return null;
          }
        })
        .filter((e) => e !== null)
        .find((e) => e.name === "Charge");
      const messageEvent = chargeEvent?.args.message;
      // expect(messageEvent).to.equal(JSON.stringify(message));
    });

    it("Should admin withdraw token", async () => {
      const { wallet1 } = await getEOAAccounts();
      const balance = await testERC20.balanceOf(tokenMessageEmitter.target);
      const withdrawTx = await tokenMessageEmitter.withdrawToken(
        testERC20.target,
        wallet1.address,
        balance
      );
      const withdrawReceipt = withdrawTx.wait();
      await expect(withdrawReceipt).to.emit(testERC20, "Transfer");
    });
  });

  // describe("Use bytes", async () => {
  //   it("User bytes: Should tip for other user successfully", async () => {
  //     const { wallet1 } = await getEOAAccounts();
  //     const amount = ethers.parseUnits("10", 18);
  //     const message = {
  //       msg: "The post is great 你好你好你好你好你好".repeat(100),
  //       postId: "123123",
  //     };

  //     const approveTx = await testERC20.approve(tokenMessageEmitter.target, amount);
  //     await approveTx.wait();

  //     const tipTx = await tokenMessageEmitter.transferERC20WithBytesMessage(
  //       testERC20.target,
  //       wallet1.address,
  //       ethers.parseUnits("10", 18),
  //       ethers.toUtf8Bytes(JSON.stringify(message))
  //     );

  //     await tipTx.wait();
  //     await expect(tipTx)
  //       .to.emit(tokenMessageEmitter, "TipWithBytesMessage")
  //       .to.emit(testERC20, "Transfer");
  //     const tipReceipt = await tipTx.wait();
  //     const tipEvent = tipReceipt!.logs
  //       .map((e) => {
  //         try {
  //           const event = tokenMessageEmitter.interface.parseLog(e as any);
  //           return event;
  //         } catch (error) {
  //           return null;
  //         }
  //       })
  //       .filter((e) => e !== null)
  //       .find((e) => e.name === "TipWithBytesMessage");
  //     const messageEvent = tipEvent?.args.message;
  //     expect(ethers.toUtf8String(messageEvent)).to.equal(
  //       JSON.stringify(message)
  //     );
  //   });

  //   it("User bytes: Should charge service successfully", async () => {
  //     const amount = ethers.parseUnits("10", 18);
  //     const message = {
  //       msg: "Enable the Extend Community 你好你好你好你好你好 \xf0 你好你好你好你好你好\x28\x8c\x28".repeat(10000),
  //       serviceId: "456456",
  //     };

  //     const approveTx = await testERC20.approve(tokenMessageEmitter.target, amount);
  //     await approveTx.wait();

  //     const chargeTx = await tokenMessageEmitter.chargeWithBytesMessage(
  //       testERC20.target,
  //       ethers.parseUnits("10", 18),
  //       ethers.toUtf8Bytes(JSON.stringify(message))
  //     );

  //     await chargeTx.wait();
  //     await expect(chargeTx)
  //       .to.emit(tokenMessageEmitter, "ChargeWithBytesMessage")
  //       .to.emit(testERC20, "Transfer");
  //     const chargeReceipt = await chargeTx.wait();
  //     const chargeEvent = chargeReceipt!.logs
  //       .map((e) => {
  //         try {
  //           const event = tokenMessageEmitter.interface.parseLog(e as any);
  //           return event;
  //         } catch (error) {
  //           return null;
  //         }
  //       })
  //       .filter((e) => e !== null)
  //       .find((e) => e.name === "ChargeWithBytesMessage");
  //     const messageEvent = chargeEvent?.args.message;
  //     expect(ethers.toUtf8String(messageEvent)).to.equal(
  //       JSON.stringify(message)
  //     );
  //   });
  // });
});
