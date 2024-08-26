import { ethers } from "hardhat";
import { getEOAAccounts } from "../util/getEoaAccount";
import { expect } from "chai";
import { BicForwarder, BicTokenPaymaster, Handles, HandlesController, TestMarketplace } from "../../../typechain-types";


describe('ControllerWithForwarder', function () {
    let randomWalletAddress;

    let usernameHandles: Handles;
    let handlesController: HandlesController;
    let bic: BicTokenPaymaster;
    let testMarketplace: TestMarketplace;
    let bicForwarder: BicForwarder;

    before(async () => {
        const { deployer, wallet1, wallet2, wallet3, wallet4 } = await getEOAAccounts();

        const Handles = await ethers.getContractFactory('Handles');
        const handle = await Handles.deploy();
        await handle.waitForDeployment();

        const BicFactory = await ethers.getContractFactory('BicFactory');
        const bicFactory = await BicFactory.deploy();
        await bicFactory.waitForDeployment();

        const txCloneHandle = await bicFactory.deployProxyByImplementation(handle.target as any, '0x' as any, ethers.ZeroHash as any);
        const txCloneHandleReceipt = await txCloneHandle.wait();

        const cloneAddress = txCloneHandleReceipt.logs[0].args[1];
        usernameHandles = await ethers.getContractAt('Handles', cloneAddress as any);
        usernameHandles.initialize('bic', 'bic', 'bic', deployer.address);

        const EntryPoint = await ethers.getContractFactory("EntryPointTest");
        const entryPoint = await EntryPoint.deploy();

        const BicTokenPaymaster = await ethers.getContractFactory('BicTokenPaymaster');
        bic = await BicTokenPaymaster.deploy(entryPoint.target);

        const HandlesController = await ethers.getContractFactory('HandlesController');
        handlesController = await HandlesController.deploy(bic.target);``
        await handlesController.waitForDeployment();
        await usernameHandles.setController(handlesController.target);

        await handlesController.setVerifier(wallet3.address);

        randomWalletAddress = ethers.Wallet.createRandom().address;
        await handlesController.setCollector(randomWalletAddress as any);


        const TestMarketplace = await ethers.getContractFactory('TestMarketplace');

        const BicForwarder = await ethers.getContractFactory("BicForwarder");

        bicForwarder = await BicForwarder.deploy();
        await bicForwarder.waitForDeployment();
        testMarketplace = await TestMarketplace.deploy(bic.target, [bicForwarder.target]);

        const setMarketTx = await handlesController.setMarketplace(testMarketplace.target);
        await setMarketTx.wait();

        const setForwarderTx = await handlesController.setForwarder(bicForwarder.target);
        await setForwarderTx.wait();

        const mintBicTx = await bic.mint(wallet4.address, ethers.parseUnits(1e5.toString(), 18));
        await mintBicTx.wait();
        const newConfig = [100n, 200n, 300n];
        const updateTx = await handlesController.setAuctionMarketplaceConfig({
            buyoutBidAmount: newConfig[0],
            timeBufferInSeconds: newConfig[1],
            bidBufferBps: newConfig[2]
        });
        await expect(updateTx)
            .to.emit(handlesController, "SetAuctionMarketplace")
            .withArgs(newConfig);

        await bicForwarder.addController(handlesController.target as any);

    });

    describe("Controller: create auction and bidding in once transaction", async function () {
        it("Controller: should FAILED create and bidding auction by forwarder", async () => {
            const { wallet3, wallet4 } = await getEOAAccounts();
            const mintName = 'test-create-and-bidding'
            const price = ethers.parseEther('12');
            // const block = await ethers.provider.getBlock('latest');

            const currentTime = Math.floor(Date.now() / 1000);
            const nextHour = currentTime + 60 * 60;
            const requestData: any = {
                receiver: wallet4.address,
                handle: usernameHandles.target,
                name: mintName,
                price: price,
                beneficiaries: [],
                collects: [],
                commitDuration: 60 * 60 * 24 * 30,
                isAuction: true
            }

            const dataHash = await handlesController.getRequestHandleOp(requestData, nextHour, currentTime);
            const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
            const requestTx = handlesController.connect(wallet4).requestHandle(requestData, nextHour, currentTime, signature);
            await expect(requestTx)
                .revertedWith("ERC20: insufficient allowance")
        });

        it("Controller: should FAILED when reverted from forwarder", async () => {
            const { wallet3, wallet4 } = await getEOAAccounts();
            const mintName = 'test-create-and-bidding'
            const price = ethers.parseEther('0');
            // const block = await ethers.provider.getBlock('latest');

            const currentTime = Math.floor(Date.now() / 1000);
            const nextHour = currentTime + 60 * 60;
            const requestData: any = {
                receiver: wallet4.address,
                handle: usernameHandles.target,
                name: mintName,
                price: price,
                beneficiaries: [],
                collects: [],
                commitDuration: 60 * 60 * 24 * 30,
                isAuction: true
            }

            const dataHash = await handlesController.getRequestHandleOp(requestData, nextHour, currentTime);
            const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
            const requestTx = handlesController.connect(wallet4).requestHandle(requestData, nextHour, currentTime, signature);
            await expect(requestTx)
                .revertedWith("Marketplace: Bid amount must be greater than 0")
        });

        it("Controller: should create and bidding auction by forwarder successfully", async () => {
            const { wallet3, wallet4 } = await getEOAAccounts();

            const approveTx = await bic.connect(wallet4).approve(testMarketplace.target, ethers.parseUnits(1e5.toString(), 18));
            await approveTx.wait();

            const mintName = 'test-create-and-bidding'
            const price = ethers.parseEther('200');
            // const block = await ethers.provider.getBlock('latest');

            const currentTime = Math.floor(Date.now() / 1000);
            const nextHour = currentTime + 60 * 60;
            const requestData = {
                receiver: wallet4.address,
                handle: usernameHandles.target,
                name: mintName,
                price: price,
                beneficiaries: [],
                collects: [],
                commitDuration: 60 * 60 * 24 * 30,
                isAuction: true
            }

            const dataHash = await handlesController.getRequestHandleOp(requestData, nextHour, currentTime);
            const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
            const requestTx = await handlesController.connect(wallet4).requestHandle(requestData, nextHour, currentTime, signature);
            await requestTx.wait();
            const nextAuctionId = await testMarketplace.auctionId();
            const bidInAuctionData = testMarketplace.interface.encodeFunctionData('bidInAuction', [nextAuctionId, price]);
            await expect(requestTx)
                .to.emit(handlesController, "CreateAuction").withArgs(nextAuctionId)
                .to.emit(testMarketplace, "NewBid")
                .to.emit(bic, "Transfer").withArgs(wallet4.address, testMarketplace.target, price)
                .to.emit(bicForwarder, "Requested").withArgs(handlesController.target, wallet4.address, testMarketplace.target, bidInAuctionData, 0n)


            const tokenId = await usernameHandles.getTokenId(mintName);
            expect(await usernameHandles.ownerOf(tokenId)).to.equal(testMarketplace.target);
            const auctionId = await testMarketplace.auctionId();
            expect(auctionId).to.equal(nextAuctionId);


            const nextBalance = await bic.balanceOf(testMarketplace.target);
            expect(nextBalance).to.equal(price);
        });


        it("Controller: should create and NOT Bidding if forwarder is address(0)", async () => {
            const { wallet3, wallet4 } = await getEOAAccounts();

            const setForwarderTx = await handlesController.setForwarder(ethers.ZeroAddress);
            await setForwarderTx.wait();

            const mintName = 'test-create-and-not-bidding'
            const price = ethers.parseEther('15');
            // const block = await ethers.provider.getBlock('latest');

            const currentTime = Math.floor(Date.now() / 1000);
            const nextHour = currentTime + 60 * 60;
            const requestData = {
                receiver: wallet4.address,
                handle: usernameHandles.target,
                name: mintName,
                price: price,
                beneficiaries: [],
                collects: [],
                commitDuration: 60 * 60 * 24 * 30,
                isAuction: true
            }

            const dataHash = await handlesController.getRequestHandleOp(requestData, nextHour, currentTime);
            const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
            const requestTx = await handlesController.connect(wallet4).requestHandle(requestData, nextHour, currentTime, signature);
            await requestTx.wait();
            const nextAuctionId = await testMarketplace.auctionId();

            const prevBalance = await bic.balanceOf(testMarketplace.target);

            await expect(requestTx)
                .to.emit(handlesController, "CreateAuction").withArgs(nextAuctionId)
            // .to.emit(testMarketplace, "NewBid")
            // .to.emit(bic, "Transfer").withArgs(wallet4.address, testMarketplace.target, price)
            // .to.emit(bicForwarder, "Requested").withArgs(handlesController.target, wallet4.address, testMarketplace.target, bidInAuctionData, 0n)


            const tokenId = await usernameHandles.getTokenId(mintName);
            expect(await usernameHandles.ownerOf(tokenId)).to.equal(testMarketplace.target);
            const auctionId = await testMarketplace.auctionId();
            expect(auctionId).to.equal(nextAuctionId);


            const nextBalance = await bic.balanceOf(testMarketplace.target);
            // because forwarder is address(0) so the balance should be the same
            expect(nextBalance).to.equal(prevBalance + BigInt(0));
        });

    });
});
