import { expect } from "chai";
import { ethers } from "hardhat";
import { BicForwarder, TestERC20, TestMarketplace } from "../../../typechain-types";
import { getEOAAccounts } from "../util/getEoaAccount";

describe("BicForwarder With 3rd Marketplace", function () {
    let bicForwarder: BicForwarder;
    let testMarketplace: TestMarketplace;
    let testERC20: TestERC20;

    before(async () => {
        const BicForwarder = await ethers.getContractFactory(
            "BicForwarder"
        );
        bicForwarder = await BicForwarder.deploy();
        await bicForwarder.waitForDeployment();


        const TestERC20 = await ethers.getContractFactory("TestERC20");
        testERC20 = await TestERC20.deploy();
        await testERC20.waitForDeployment();

        const TestMarketplace = await ethers.getContractFactory("TestMarketplace");
        testMarketplace = await TestMarketplace.deploy(testERC20.target, [bicForwarder.target]);
        await testMarketplace.waitForDeployment();

        // Transfer some tokens to wallet1

    });

    it("Should bid in auction by forwarder", async () => {
        const { deployer, wallet1 } = await getEOAAccounts();
        // Transfer some tokens to wallet1
        const transferTx = await testERC20.transfer(wallet1.address, ethers.parseEther("10000"));
        await transferTx.wait();


        const bidAmount = ethers.parseEther("50");
        const auctionId = 0;

        const approveTx = await testERC20.connect(wallet1).approve(testMarketplace.target, bidAmount);
        await approveTx.wait();

        await bicForwarder.addController(deployer.address);

        const bidData = testMarketplace.interface.encodeFunctionData("bidInAuction", [auctionId, bidAmount]);
        const bidAuctionByFW = await bicForwarder.connect(deployer).forwardRequest({
            from: wallet1.address,
            to: testMarketplace.target,
            value: 0,
            data: bidData
        });
        await bidAuctionByFW.wait();
        await expect(bidAuctionByFW).to.emit(testERC20, "Transfer").withArgs(wallet1.address, testMarketplace.target, bidAmount);


        const auction = await testMarketplace.auctions(auctionId);
        expect(auction.highestBidder).to.be.equal(wallet1.address);
        expect(auction.bidAmount).to.be.equal(bidAmount);
    });

    it("Should bid in auction by EOA", async () => {
        const { deployer, wallet2 } = await getEOAAccounts();

        // Transfer some tokens to wallet1
        const transferTx = await testERC20.transfer(wallet2.address, ethers.parseEther("10000"));
        await transferTx.wait();

        const bidAmount = ethers.parseEther("51");
        const auctionId = 0;

        const approveTx = await testERC20.connect(wallet2).approve(testMarketplace.target, bidAmount);
        await approveTx.wait();

        const bidAuctionByEOA = await testMarketplace.connect(wallet2).bidInAuction(auctionId, bidAmount);
        await bidAuctionByEOA.wait();
        await expect(bidAuctionByEOA).to.emit(testERC20, "Transfer").withArgs(wallet2.address, testMarketplace.target, bidAmount);

        const auction = await testMarketplace.auctions(auctionId);
        expect(auction.highestBidder).to.be.equal(wallet2.address);
        expect(auction.bidAmount).to.be.equal(bidAmount);
    });

    it('Should revert when bid amount equals to 0', async () => {
        const { deployer, wallet1 } = await getEOAAccounts();
        const bidAmount = 0n;
        const auctionId = 0;

        const approveTx = await testERC20.connect(wallet1).approve(testMarketplace.target as any, bidAmount as any);
        await approveTx.wait();

        await bicForwarder.addController(deployer.address as any);

        const bidData = testMarketplace.interface.encodeFunctionData("bidInAuction", [auctionId, bidAmount]);
        await expect(bicForwarder.connect(deployer).forwardRequest({
            from: wallet1.address,
            to: testMarketplace.target,
            value: 0,
            data: bidData
        } as any)).to.be.revertedWith("Marketplace: Bid amount must be greater than 0");
    })

    it('Should return Forwarding request failed when call revert zero data', async () => {
        const { deployer, wallet1 } = await getEOAAccounts();

        await bicForwarder.addController(deployer.address as any);

        const bidData = testMarketplace.interface.encodeFunctionData("testRevertWithoutAnyData", []);
        await expect(bicForwarder.connect(deployer).forwardRequest({
            from: wallet1.address,
            to: testMarketplace.target,
            value: 0,
            data: bidData
        } as any)).to.be.revertedWith("Forwarding request failed");
    })

    it('Should return empty string when call revert zero message', async () => {
        const { deployer, wallet1 } = await getEOAAccounts();

        await bicForwarder.addController(deployer.address as any);

        const bidData = testMarketplace.interface.encodeFunctionData("testRevertZeroInfo", []);
        await expect(bicForwarder.connect(deployer).forwardRequest({
            from: wallet1.address,
            to: testMarketplace.target,
            value: 0,
            data: bidData
        } as any)).to.be.revertedWith("");
    })
});
