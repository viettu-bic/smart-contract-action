import {ethers} from "hardhat";
import {getEOAAccounts} from "../util/getEoaAccount";
import {expect} from "chai";
import {controller} from "../../../typechain-types/contracts/namespaces";


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

        await handlesController.setPrices([ethers.parseEther('1'), ethers.parseEther('0.5'), ethers.parseEther('0.1'), ethers.parseEther('0.05'), ethers.parseEther('0.01')]);
        randomWalletAddress = ethers.Wallet.createRandom().address;
        await handlesController.setCollector(randomWalletAddress as any);
    });

    it('Controller: create nft directly', async function () {
        await bic.mintTokens(wallet1.address, ethers.parseEther('1') as any);
        const initialBicBalance = await bic.balanceOf(wallet1.address);
        expect(initialBicBalance).to.equal(ethers.parseEther('1'));
        await bic.connect(wallet1).approve(handlesController.target, ethers.parseEther('1'));
        const mintName = 'testt'
        const dataHash = await handlesController.getRequestHandlesOp(wallet1.address, usernameHandles.target, mintName, [wallet2.address], [1000], 0, false);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlesController.connect(wallet1).requestHandles(wallet1.address, usernameHandles.target, mintName, [wallet2.address], [1000], 0, false, signature);
        const tokenId = await usernameHandles.getTokenId(mintName);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(wallet1.address);
        const price = await handlesController.getPrice(mintName);
        expect(initialBicBalance - price).to.equal(await bic.balanceOf(wallet1.address));
        expect(await bic.balanceOf(wallet2.address)).to.equal(price/10n);
        expect(await bic.balanceOf(randomWalletAddress)).to.equal(price*9n/10n);
    });

    it('Controller: commit to mint nft', async function () {
        await bic.mintTokens(wallet1.address, ethers.parseEther('1'));
        const initialBicBalance = await bic.balanceOf(wallet1.address);
        expect(initialBicBalance).to.equal(ethers.parseEther('1'));

        const mintName = 'testt'
        const dataHash = await handlesController.getRequestHandlesOp(wallet1.address, usernameHandles.target, mintName, [wallet2.address,wallet3.address], [1000, 2000], 60*60*24*30, false);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlesController.connect(wallet1).requestHandles(wallet1.address, usernameHandles.target, mintName, [wallet2.address,wallet3.address], [1000, 2000], 60*60*24*30, false, signature);
        const commitTime = await handlesController.commitments(dataHash);
        const tokenId = await usernameHandles.getTokenId(mintName);
        try {
            await usernameHandles.ownerOf(tokenId);
            expect.fail();
        } catch (e) {
            expect(e.message).to.contain('ERC721: invalid token ID');
        }
        await ethers.provider.send('evm_increaseTime', [Number(commitTime)]);
        await bic.connect(wallet1).approve(handlesController.target, ethers.parseEther('1'));
        await handlesController.connect(wallet1).requestHandles(wallet1.address, usernameHandles.target, mintName, [wallet2.address,wallet3.address], [1000, 2000], 60*60*24*30, false, signature);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(wallet1.address);
        const price = await handlesController.getPrice(mintName);
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
        const dataHash = await handlesController.getRequestHandlesOp(wallet1.address, usernameHandles.target, mintName, [wallet2.address], [1000], 60*60*24*30, true);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlesController.connect(wallet1).requestHandles(wallet1.address, usernameHandles.target, mintName, [wallet2.address], [1000], 60*60*24*30, true, signature);
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
