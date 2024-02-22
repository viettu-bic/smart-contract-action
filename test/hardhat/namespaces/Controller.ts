import {ethers} from "hardhat";
import {getEOAAccounts} from "../util/getEoaAccount";
import {expect} from "chai";
import {controller} from "../../../typechain-types/contracts/namespaces";


describe('Controller', function () {
    let deployer;
    let wallet1;
    let wallet2;
    let wallet3;
    let randomWalletAddress = ethers.Wallet.createRandom().address;

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

        await handlesController.setPrices([ethers.parseEther('1'), ethers.parseEther('0.5'), ethers.parseEther('0.1'), ethers.parseEther('0.05')]);
        await handlesController.setCollector(randomWalletAddress as any);
    });

    it('Controller: create nft directly', async function () {
        await bic.mintTokens(wallet1.address, ethers.parseEther('1000') as any);
        await bic.connect(wallet1).approve(handlesController.target, ethers.parseEther('1000'));
        const mintName = 'testt'
        const dataHash = await handlesController.getRequestHandlesOp(wallet1.address, usernameHandles.target, mintName, [wallet2.address], [1000], 0, false);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlesController.connect(wallet1).requestHandles(wallet1.address, usernameHandles.target, mintName, [wallet2.address], [1000], 0, false, signature);
        const tokenId = await usernameHandles.getTokenId(mintName);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(wallet1.address);
    });

    it('Controller: commit to mint nft', async function () {
        await bic.mintTokens(wallet1.address, ethers.parseEther('1000'));
        await bic.connect(wallet1).approve(handlesController.target, ethers.parseEther('1000'));
        const mintName = 'testt'
        const dataHash = await handlesController.getRequestHandlesOp(wallet1.address, usernameHandles.target, mintName, [wallet2.address], [1000], 60*60*24*30, false);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlesController.connect(wallet1).requestHandles(wallet1.address, usernameHandles.target, mintName, [wallet2.address], [1000], 60*60*24*30, false, signature);
        const commitTime = await handlesController.commitments(dataHash);
        const tokenId = await usernameHandles.getTokenId(mintName);
        try {
            await usernameHandles.ownerOf(tokenId);
            expect.fail();
        } catch (e) {
            expect(e.message).to.contain('ERC721: invalid token ID');
        }
        await ethers.provider.send('evm_increaseTime', [Number(commitTime)]);
        await handlesController.connect(wallet1).requestHandles(wallet1.address, usernameHandles.target, mintName, [wallet2.address], [1000], 60*60*24*30, false, signature);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(wallet1.address);
    })

    it('Controller: mint nft and create auction', async function () {
        const TestMarketplace = await ethers.getContractFactory('TestMarketplace');
        const testMarketplace = await TestMarketplace.deploy();
        await handlesController.setMarketplace(testMarketplace.target as any);
        await bic.mintTokens(wallet1.address, ethers.parseEther('1000'));
        await bic.connect(wallet1).approve(handlesController.target, ethers.parseEther('1000'));
        const mintName = 'testt'
        const dataHash = await handlesController.getRequestHandlesOp(wallet1.address, usernameHandles.target, mintName, [wallet2.address], [1000], 60*60*24*30, true);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlesController.connect(wallet1).requestHandles(wallet1.address, usernameHandles.target, mintName, [wallet2.address], [1000], 60*60*24*30, true, signature);
        const tokenId = await usernameHandles.getTokenId(mintName);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(handlesController.target);
        const auctionId = await testMarketplace.auctionId();
        expect(auctionId).to.equal(1n);
    })
});
