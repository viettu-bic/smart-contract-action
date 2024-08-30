import {expect} from "chai";
import {ethers} from "hardhat";
import {Erc20TransferMessage, TestERC20} from "../../../typechain-types";
import {getEOAAccounts} from "../util/getEoaAccount";

describe("Erc20TransferMessage", function () {
    let erc20TransferMessage: Erc20TransferMessage;
    let testERC20: TestERC20;

    before(async () => {
        const {wallet1} = await getEOAAccounts();

        const TestERC20 = await ethers.getContractFactory("TestERC20");
        testERC20 = await TestERC20.deploy();
        await testERC20.waitForDeployment();

        const Erc20TransferMessage = await ethers.getContractFactory("Erc20TransferMessage");
        erc20TransferMessage = await Erc20TransferMessage.deploy();
        await erc20TransferMessage.waitForDeployment();

        await testERC20.transfer(wallet1.address, ethers.parseUnits("1000", 18));
    });

    it("Erc20TransferMessage: Should tip for other user successfully", async () => {
        const {wallet1} = await getEOAAccounts();
        const amount = ethers.parseUnits("10", 18);
        const message = {
            msg: "The post is great 你好你好你好你好你好".repeat(100),
            postId: "123123",
        };

        const approveTx = await testERC20.approve(erc20TransferMessage.target, amount);
        await approveTx.wait();

        const tipTx = await erc20TransferMessage.transferERC20(
            testERC20.target,
            wallet1.address,
            ethers.parseUnits("10", 18),
            JSON.stringify(message)
        );

        await tipTx.wait();
        await expect(tipTx)
            .to.emit(erc20TransferMessage, "ERC20Message")
            .to.emit(testERC20, "Transfer");
        const tipReceipt = await tipTx.wait();
        const tipEvent = tipReceipt!.logs
            .map((e) => {
                try {
                    const event = erc20TransferMessage.interface.parseLog(e as any);
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

    it("Erc20TransferMessage: Should charge service successfully", async () => {
        const amount = ethers.parseUnits("10", 18);
        const message = {
            msg: "Enable the Extend Community 你好你好你好你好你好 \xf0 你好你好你好你好你好\x28\x8c\x28".repeat(5000),
            serviceId: "456456",
        };

        const approveTx = await testERC20.approve(erc20TransferMessage.target, amount);
        await approveTx.wait();

        const chargeTx = await erc20TransferMessage.charge(
            testERC20.target,
            erc20TransferMessage.target,
            ethers.parseUnits("10", 18),
            JSON.stringify(message)
        );

        await chargeTx.wait();
        await expect(chargeTx)
            .to.emit(erc20TransferMessage, "ERC20Charge")
            .to.emit(testERC20, "Transfer");
        const chargeReceipt = await chargeTx.wait();
        const chargeEvent = chargeReceipt!.logs
            .map((e) => {
                try {
                    const event = erc20TransferMessage.interface.parseLog(e as any);
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
});
