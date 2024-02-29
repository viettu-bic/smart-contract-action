import {ethers} from "hardhat";
import {getEOAAccounts} from "../util/getEoaAccount";
import {expect} from "chai";
import {controller} from "../../../typechain-types/contracts/namespaces";
import {parseEther} from "ethers";


describe('Controller', function () {
    let deployer;
    let wallet1;
    let wallet2;
    let wallet3;
    let randomWalletAddress;

    let bicPermissionsEnumerable;
    let usernameHandles;
    let handlesController;
    let bic;

    beforeEach(async () => {
        const GintoNordFontSVG = await ethers.getContractFactory('GintoNordFontSVG');
        const gintoNordFontSVG = await GintoNordFontSVG.deploy();
        const HandleSVG = await ethers.getContractFactory('HandleSVG', {libraries: {GintoNordFontSVG: gintoNordFontSVG.target}});
        const handleSVG = await HandleSVG.deploy();

        const BicPermissionsEnumerable = await ethers.getContractFactory('BicPermissions');
        const UsernameHandles = await ethers.getContractFactory('OwnershipUsernameHandles');
        const HandlesController = await ethers.getContractFactory('HandlesController');
        const BicTokenPaymaster = await ethers.getContractFactory('BicTokenPaymaster');
        bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
        await bicPermissionsEnumerable.waitForDeployment();
        usernameHandles = await UsernameHandles.deploy(bicPermissionsEnumerable.target);
        await usernameHandles.waitForDeployment();

        const EntryPoint = await ethers.getContractFactory("EntryPointTest");
        const entryPoint = await EntryPoint.deploy();
        bic = await BicTokenPaymaster.deploy(ethers.ZeroAddress, entryPoint.target);
        handlesController = await HandlesController.deploy(bicPermissionsEnumerable.target, bic.target);
        await handlesController.waitForDeployment();
        await usernameHandles.setController(handlesController.target);

        ({deployer, wallet1, wallet2, wallet3} = await getEOAAccounts());
        await handlesController.setVerifier(wallet3.address);

        randomWalletAddress = ethers.Wallet.createRandom().address;
        await handlesController.setCollector(randomWalletAddress as any);
    });

    it('Controller: create nft directly', async function () {
        await bic.mintTokens(wallet1.address, ethers.parseEther('1') as any);
        const initialBicBalance = await bic.balanceOf(wallet1.address);
        expect(initialBicBalance).to.equal(ethers.parseEther('1'));
        await bic.connect(wallet1).approve(handlesController.target, ethers.parseEther('1'));
        const mintName = 'testt'
        const currentTime = Math.floor(Date.now() / 1000);
        const nextHour = currentTime + 60*60;
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
        expect(await bic.balanceOf(wallet2.address)).to.equal(price/10n);
        expect(await bic.balanceOf(randomWalletAddress)).to.equal(price*9n/10n);
    });

    it('Controller: commit to mint nft', async function () {
        await bic.mintTokens(wallet1.address, ethers.parseEther('1'));
        const initialBicBalance = await bic.balanceOf(wallet1.address);
        expect(initialBicBalance).to.equal(ethers.parseEther('1'));
        const currentTime = Math.floor(Date.now() / 1000);
        const nextHour = currentTime + 60*60;
        const mintName = 'testt'
        const price = ethers.parseEther('1');
        const dataHash = await handlesController.getRequestHandleOp({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address,wallet3.address],
            collects: [1000, 2000],
            commitDuration: 60*60*24*30,
            isAuction: false
        } as any, nextHour as any, currentTime as any);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlesController.connect(wallet1).requestHandle({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address,wallet3.address],
            collects: [1000, 2000],
            commitDuration: 60*60*24*30,
            isAuction: false
        } as any, nextHour as any, currentTime as any, signature as any);
        const commitTime = await handlesController.commitments(dataHash);
        const tokenId = await usernameHandles.getTokenId(mintName);
        try {
            await usernameHandles.ownerOf(tokenId);
            expect.fail();
        } catch (e) {
            expect(e.message).to.contain('ERC721: invalid token ID');
        }
        await ethers.provider.send('evm_increaseTime', [60*60*24*30]);
        console.log('new')
        await bic.connect(wallet1).approve(handlesController.target, ethers.parseEther('1'));
        const newCurrentTime = Math.floor(Date.now() / 1000) + 60*60*24*30;
        const newNextHour = newCurrentTime + 60*60;
        const newDataHash = await handlesController.getRequestHandleOp({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address,wallet3.address],
            collects: [1000, 2000],
            commitDuration: 60*60*24*30,
            isAuction: false
        } as any, newNextHour as any, newCurrentTime as any);
        const newSignature = await wallet3.signMessage(ethers.getBytes(newDataHash));
        await handlesController.connect(wallet1).requestHandle({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address,wallet3.address],
            collects: [1000, 2000],
            commitDuration: 60*60*24*30,
            isAuction: false
        } as any, newNextHour as any, newCurrentTime as any, newSignature as any);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(wallet1.address);
        expect(initialBicBalance - price).to.equal(await bic.balanceOf(wallet1.address));
        expect(await bic.balanceOf(wallet2.address)).to.equal(price/10n);
        expect(await bic.balanceOf(wallet3.address)).to.equal(price/5n);
        expect(await bic.balanceOf(randomWalletAddress)).to.equal(price*7n/10n);
    })

    it('Controller: mint nft and create auction', async function () {
        const TestMarketplace = await ethers.getContractFactory('TestMarketplace');
        const testMarketplace = await TestMarketplace.deploy();
        await handlesController.setMarketplace(testMarketplace.target as any);
        const mintName = 'testt'
        const price = ethers.parseEther('1');
        const currentTime = Math.floor(Date.now() / 1000) + 60*60*24*30;
        const nextHour = currentTime + 60*60;
        const dataHash = await handlesController.getRequestHandleOp({
            receiver: wallet1.address,
            handle: usernameHandles.target,
            name: mintName,
            price: price,
            beneficiaries: [wallet2.address],
            collects: [1000],
            commitDuration: 60*60*24*30,
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
            commitDuration: 60*60*24*30,
            isAuction: true
        } as any, nextHour as any, currentTime as any, signature as any);
        const tokenId = await usernameHandles.getTokenId(mintName);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(testMarketplace.target);
        const auctionId = await testMarketplace.auctionId();
        expect(auctionId).to.equal(1n);

        // let assume that auction result is 1 BIC
        await bic.mintTokens(handlesController.target, ethers.parseEther('1'));
        const collectDataHash = await handlesController.getCollectAuctionPayoutOp(mintName, ethers.parseEther('1'));
        const collectSignature = await wallet3.signMessage(ethers.getBytes(collectDataHash));
        await handlesController.connect(wallet1).collectAuctionPayout(mintName, ethers.parseEther('1'), collectSignature);

        expect(await bic.balanceOf(wallet2.address)).to.equal(ethers.parseEther('1')/10n);
        expect(await bic.balanceOf(randomWalletAddress)).to.equal(ethers.parseEther('1')*9n/10n);
    })
});
