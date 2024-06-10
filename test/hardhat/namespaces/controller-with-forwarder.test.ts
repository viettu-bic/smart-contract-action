import { ethers } from "hardhat";
import { getEOAAccounts } from "../util/getEoaAccount";
import { expect } from "chai";
import { controller } from "../../../typechain-types/contracts/namespaces";
import { parseEther } from "ethers";
import { BicPermissions, BicTokenPaymaster, Handles, HandlesController, TestMarketplace } from "../../../typechain-types";


describe('ControllerWithForwarder', function () {
    let randomWalletAddress;

    let bicPermissionsEnumerable: BicPermissions;
    let usernameHandles: Handles;
    let handlesController: HandlesController;
    let bic: BicTokenPaymaster;
    let testMarketplace: TestMarketplace;

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

        const BicPermissionsEnumerable = await ethers.getContractFactory('BicPermissions');
        bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
        await bicPermissionsEnumerable.waitForDeployment();

        const cloneAddress = txCloneHandleReceipt.logs[0].args[1];
        usernameHandles = await ethers.getContractAt('Handles', cloneAddress as any);
        usernameHandles.initialize('bic', 'bic', 'bic', deployer.address);

        const EntryPoint = await ethers.getContractFactory("EntryPointTest");
        const entryPoint = await EntryPoint.deploy();

        const BicTokenPaymaster = await ethers.getContractFactory('BicTokenPaymaster');
        bic = await BicTokenPaymaster.deploy(ethers.ZeroAddress, entryPoint.target);

        const HandlesController = await ethers.getContractFactory('HandlesController');
        handlesController = await HandlesController.deploy(bicPermissionsEnumerable.target, bic.target);
        await handlesController.waitForDeployment();
        await usernameHandles.setController(handlesController.target);

        await handlesController.setVerifier(wallet3.address);

        randomWalletAddress = ethers.Wallet.createRandom().address;
        await handlesController.setCollector(randomWalletAddress as any);


        const TestMarketplace = await ethers.getContractFactory('TestMarketplace');

        const BicForwarder = await ethers.getContractFactory("BicForwarder");

        const bicForwarder = await BicForwarder.deploy(bicPermissionsEnumerable.target);
        await bicForwarder.waitForDeployment();
        testMarketplace = await TestMarketplace.deploy(bic.target, [bicForwarder.target]);

        const setMarketTx = await handlesController.setMarketplace(testMarketplace.target);
        await setMarketTx.wait();

        const setForwarderTx = await handlesController.setForwarder(bicForwarder.target);
        await setForwarderTx.wait();

        const mintBicTx = await bic.mint(wallet4.address, ethers.parseUnits(1e5.toString(), 18));
        await mintBicTx.wait();

        const approveTx = await bic.connect(wallet4).approve(testMarketplace.target, ethers.parseUnits(1e5.toString(), 18));
        await approveTx.wait();

        

        const grantRoleTx = await bicPermissionsEnumerable.grantRole(await bicPermissionsEnumerable.CONTROLLER_ROLE(), handlesController.target);
        await grantRoleTx.wait();
        const newConfig = [100n, 200n, 300n];
        const updateTx = await handlesController.setAuctionMarketplaceConfig({
            buyoutBidAmount: newConfig[0],
            timeBufferInSeconds: newConfig[1],
            bidBufferBps: newConfig[2]
        });
        await expect(updateTx)
            .to.emit(handlesController, "SetAuctionMarketplace")
            .withArgs(newConfig);

    });
    
    describe("Controller: create auction and bidding in once transaction", async function () {

        

        it("Controller: should create and bidding auction by forwarder", async () => {
        const { wallet3, wallet4 } = await getEOAAccounts();
            const mintName = 'test-create-and-bidding'
            const price = ethers.parseEther('12');
            const block = await ethers.provider.getBlock('latest');

            const currentTime = block?.timestamp;
            const nextHour = Number(currentTime) + 60 * 60;
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
            console.log("🚀 ~ it ~ requestTx:", requestTx)
            const tokenId = await usernameHandles.getTokenId(mintName);
            console.log("🚀 ~ it ~ tokenId:", tokenId)
            expect(await usernameHandles.ownerOf(tokenId)).to.equal(testMarketplace.target);
            const auctionId = await testMarketplace.auctionId();
            expect(auctionId).to.equal(1n);

        });

    });
});
