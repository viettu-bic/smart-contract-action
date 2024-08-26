import { ethers } from "hardhat";
import { getEOAAccounts } from "../util/getEoaAccount";
import { expect } from "chai";
import { parseEther } from "ethers";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";


describe('Controller', function () {
    let deployer;
    let wallet1;
    let wallet2;
    let wallet3;
    let wallet4; // Test for create auction and bid in once transaction
    let randomWalletAddress;

    let usernameHandles;
    let handlesController;
    let bic;

    beforeEach(async () => {
        ({ deployer, wallet1, wallet2, wallet3, wallet4 } = await getEOAAccounts());

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
        bic = await BicTokenPaymaster.deploy(entryPoint.target, deployer);

        const HandlesController = await ethers.getContractFactory('HandlesController');
        handlesController = await HandlesController.deploy(bic.target);
        await handlesController.waitForDeployment();
        await usernameHandles.setController(handlesController.target);

        await handlesController.setVerifier(wallet3.address);

        randomWalletAddress = ethers.Wallet.createRandom().address;
        await handlesController.setCollector(randomWalletAddress as any);

    });

    it('Controller: should be update successful Auction config', async function () {
        const currentAuctionConfig = await handlesController.auctionConfig();
        // Default
        expect(currentAuctionConfig[0]).to.equal(BigInt(0));
        expect(currentAuctionConfig[1]).to.equal(BigInt(900));
        expect(currentAuctionConfig[2]).to.equal(BigInt(1000));

        const newConfig = [100n, 200n, 300n];
        const updateTx = await handlesController.setAuctionMarketplaceConfig(newConfig);
        await expect(updateTx)
            .to.emit(handlesController, "SetAuctionMarketplace")
            .withArgs(newConfig);
        const nextAuctionConfig = await handlesController.auctionConfig();

        expect(nextAuctionConfig[0]).to.equal(newConfig[0]);
        expect(nextAuctionConfig[1]).to.equal(newConfig[1]);
        expect(nextAuctionConfig[2]).to.equal(newConfig[2]);
    });

    it('Controller: create nft directly', async function () {
        await bic.transfer(wallet1.address, ethers.parseEther('1') as any);
        const initialBicBalance = await bic.balanceOf(wallet1.address);
        expect(initialBicBalance).to.equal(ethers.parseEther('1'));
        await bic.connect(wallet1).approve(handlesController.target, ethers.parseEther('1'));
        const mintName = 'testt'
        const currentTime = Math.floor(Date.now() / 1000);
        const nextHour = currentTime + 60 * 60;
        const price = parseEther('1');
        const dataHash = await handlesController.getRequestHandleOp({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address],
            collects: [1000],
            commitDuration: 0,
            isAuction: false
        } as any, nextHour as any, currentTime as any);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlesController.connect(wallet1).requestHandle({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address],
            collects: [1000],
            commitDuration: 0,
            isAuction: false
        } as any, nextHour as any, currentTime as any, signature as any);

        const tokenId = await usernameHandles.getTokenId(mintName);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(wallet1.address);
        expect(initialBicBalance - price).to.equal(await bic.balanceOf(wallet1.address));
        expect(await bic.balanceOf(wallet2.address)).to.equal(price / 10n);
        expect(await bic.balanceOf(randomWalletAddress)).to.equal(price * 9n / 10n);
    });

    it('Controller: commit to mint nft', async function () {
        const snapshot = await helpers.takeSnapshot();
        await bic.transfer(wallet1.address, ethers.parseEther('1'));
        const initialBicBalance = await bic.balanceOf(wallet1.address);
        expect(initialBicBalance).to.equal(ethers.parseEther('1'));
        const currentTime = Math.floor(Date.now() / 1000);
        const nextHour = currentTime + 60 * 60;
        const mintName = 'testt'
        const tokenId = await usernameHandles.getTokenId(mintName);
        const price = ethers.parseEther('1');
        const commitDuration = 60 * 60 * 24 * 30;
        const dataHash = await handlesController.getRequestHandleOp({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address, wallet3.address],
            collects: [1000, 2000],
            commitDuration: commitDuration,
            isAuction: false
        } as any, nextHour as any, currentTime as any);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        const txCommit = await handlesController.connect(wallet1).requestHandle({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address, wallet3.address],
            collects: [1000, 2000],
            commitDuration: commitDuration,
            isAuction: false
        } as any, nextHour as any, currentTime as any, signature as any);
        const blockData = await ethers.provider.getBlock(txCommit.blockNumber);

        await expect(txCommit)
            .to.emit(handlesController, "Commitment")
            .withArgs(dataHash, wallet1.address, usernameHandles.target, mintName, tokenId, price, BigInt((blockData?.timestamp || 0) + commitDuration), false);

        const commitTime = await handlesController.commitments(dataHash);
        try {
            await usernameHandles.ownerOf(tokenId);
            expect.fail();
        } catch (e) {
            expect(e.message).to.contain('ERC721: invalid token ID');
        }
        await helpers.time.increase(commitDuration);
        await bic.connect(wallet1).approve(handlesController.target, ethers.parseEther('1'));
        const newCurrentTime = await ethers.provider.getBlock('latest').then(block => block!.timestamp);
        const newNextHour = newCurrentTime + 60 * 60;
        await helpers.time.increase(10);

        const newDataHash = await handlesController.getRequestHandleOp({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address, wallet3.address],
            collects: [1000, 2000],
            commitDuration: commitDuration,
            isAuction: false
        } as any, newNextHour as any, newCurrentTime as any);
        const newSignature = await wallet3.signMessage(ethers.getBytes(newDataHash));
        const txClaim = await handlesController.connect(wallet1).requestHandle({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address, wallet3.address],
            collects: [1000, 2000],
            commitDuration: commitDuration,
            isAuction: false
        } as any, newNextHour as any, newCurrentTime as any, newSignature as any);
        const blockDataAtClaim = await ethers.provider.getBlock(txClaim.blockNumber);

        await expect(txClaim)
            .to.emit(handlesController, "Commitment")
            .withArgs(dataHash, wallet1.address, usernameHandles.target, mintName, tokenId, price, 0, true);

        expect(await usernameHandles.ownerOf(tokenId)).to.equal(wallet1.address);
        expect(initialBicBalance - price).to.equal(await bic.balanceOf(wallet1.address));
        expect(await bic.balanceOf(wallet2.address)).to.equal(price / 10n);
        expect(await bic.balanceOf(wallet3.address)).to.equal(price / 5n);
        expect(await bic.balanceOf(randomWalletAddress)).to.equal(price * 7n / 10n);

        await snapshot.restore();
    })

    it('Controller: mint nft and create auction', async function () {
        const TestMarketplace = await ethers.getContractFactory('TestMarketplace');
        const testMarketplace = await TestMarketplace.deploy(bic.target, []);
        await handlesController.setMarketplace(testMarketplace.target as any);
        const mintName = 'testt'
        const price = ethers.parseEther('1');
        const currentTime = Math.floor(Date.now() / 1000);
        // const currentTime = await ethers.provider.getBlock('latest').then(block => block!.timestamp);
        const nextHour = currentTime + 60 * 60;
        // await helpers.time.increase(10);

        const dataHash = await handlesController.getRequestHandleOp({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address],
            collects: [1000],
            commitDuration: 60 * 60 * 24 * 30,
            isAuction: true
        } as any, nextHour as any, currentTime as any);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlesController.connect(wallet1).requestHandle({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address],
            collects: [1000],
            commitDuration: 60 * 60 * 24 * 30,
            isAuction: true
        } as any, nextHour as any, currentTime as any, signature as any);
        const tokenId = await usernameHandles.getTokenId(mintName);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(testMarketplace.target);
        const auctionId = await testMarketplace.auctionId();
        expect(auctionId).to.equal(1n);

        // let assume that auction result is 1 BIC
        await bic.transfer(handlesController.target, ethers.parseEther('1'));
        const collectDataHash = await handlesController.getCollectAuctionPayoutOp(auctionId, ethers.parseEther('1'), [wallet3.address], [1000]);
        const collectSignature = await wallet3.signMessage(ethers.getBytes(collectDataHash));
        await handlesController.connect(wallet1).collectAuctionPayout(auctionId, ethers.parseEther('1'), [wallet3.address], [1000], collectSignature);

        expect(await bic.balanceOf(wallet3.address)).to.equal(ethers.parseEther('1') / 10n);
        expect(await bic.balanceOf(randomWalletAddress)).to.equal(ethers.parseEther('1') * 9n / 10n);
    })

    it('Controller: mint nft and create auction but burn it because bid fail and can create again', async function () {
        const TestMarketplace = await ethers.getContractFactory('TestMarketplace');
        const testMarketplace = await TestMarketplace.deploy(bic.target, []);

        await handlesController.setMarketplace(testMarketplace.target as any);
        const mintName = 'testt'
        const price = ethers.parseEther('1');
        const currentTime = Math.floor(Date.now() / 1000);
        // const currentTime = await ethers.provider.getBlock('latest').then(block => block!.timestamp);
        const nextHour = currentTime + 60 * 60;
        // await helpers.time.increase(10);

        const dataHash = await handlesController.getRequestHandleOp({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address],
            collects: [1000],
            commitDuration: 60 * 60 * 24 * 30,
            isAuction: true
        } as any, nextHour as any, currentTime as any);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlesController.connect(wallet1).requestHandle({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address],
            collects: [1000],
            commitDuration: 60 * 60 * 24 * 30,
            isAuction: true
        } as any, nextHour as any, currentTime as any, signature as any);
        const tokenId = await usernameHandles.getTokenId(mintName);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(testMarketplace.target);
        const auctionId = await testMarketplace.auctionId();
        expect(auctionId).to.equal(1n);

        // let assume that auction fail so BIC return to controller
        await testMarketplace.collectAuctionTokens((auctionId - 1n) as any);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(handlesController.target);
        await handlesController.burnHandleMintedButAuctionFailed(usernameHandles.target, mintName);
        expect(await usernameHandles.exists(tokenId)).to.equal(false);

    });

    describe('Controller: updateCollectsDenominator', async function () {

        it('Controller: should be update successful CollectsDenominator', async function () {
            const currentCollectsDenominator = await handlesController.collectsDenominator();
            expect(currentCollectsDenominator).to.equal(10000n);
            const newCollectsDenominator = 2000n;
            await handlesController.updateCollectsDenominator(newCollectsDenominator);
            const nextCollectsDenominator = await handlesController.collectsDenominator();
            expect(nextCollectsDenominator).to.equal(newCollectsDenominator);
            const resetCollectsDenominator = 10000n;
            await handlesController.updateCollectsDenominator(resetCollectsDenominator);
            const finalCollectsDenominator = await handlesController.collectsDenominator();
            expect(finalCollectsDenominator).to.equal(resetCollectsDenominator);
        })

        it('Controller: should not update CollectsDenominator if not owner', async function () {
            const newCollectsDenominator = 2000n;
            await expect(
                handlesController.connect(wallet2).updateCollectsDenominator(newCollectsDenominator)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        })

    });

    describe('Controller: withdraw', async function () {
        it('Controller: should withdraw bic successfully', async function () {
            const randomWalletAddress = ethers.Wallet.createRandom().address;
            await bic.mint(handlesController.target, ethers.parseEther('1'));
            const initialBicBalance = await bic.balanceOf(handlesController.target);
            expect(initialBicBalance).to.equal(ethers.parseEther('1'));
            const bicRandomWalletBalance = await bic.balanceOf(randomWalletAddress);
            expect(bicRandomWalletBalance).to.equal(0);
            await handlesController.withdraw(bic.target, randomWalletAddress, ethers.parseEther('1'));
            expect(await bic.balanceOf(handlesController.target)).to.equal(0);
            expect(await bic.balanceOf(randomWalletAddress)).to.equal(ethers.parseEther('1'));
        });

        it('Controller: should not withdraw if not owner', async function () {
            const randomWalletAddress = ethers.Wallet.createRandom().address;

            await expect(
                handlesController.connect(wallet2).withdraw(bic.target, randomWalletAddress, ethers.parseEther('1'))
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});
