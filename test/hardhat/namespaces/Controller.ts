import {ethers} from "hardhat";
import {getEOAAccounts} from "../util/getEoaAccount";
import {expect} from "chai";


describe('Controller', function () {
    let deployer;
    let wallet1;
    let wallet2;
    let wallet3;

    let bicPermissionsEnumerable;
    let usernameHandles;
    let handlerController;
    let bic;

    beforeEach(async () => {
        const GintoNordFontSVG = await ethers.getContractFactory('GintoNordFontSVG');
        const gintoNordFontSVG = await GintoNordFontSVG.deploy();
        const HandleSVG = await ethers.getContractFactory('HandleSVG', {libraries: {GintoNordFontSVG: gintoNordFontSVG.target}});
        const handleSVG = await HandleSVG.deploy();

        const BicPermissionsEnumerable = await ethers.getContractFactory('BicPermissions');
        const UsernameHandles = await ethers.getContractFactory('UsernameHandles');
        const HandlerController = await ethers.getContractFactory('HandlerController');
        const BicTokenPaymaster = await ethers.getContractFactory('BicTokenPaymaster');
        bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
        await bicPermissionsEnumerable.waitForDeployment();
        usernameHandles = await UsernameHandles.deploy(bicPermissionsEnumerable.target);
        await usernameHandles.waitForDeployment();

        const EntryPoint = await ethers.getContractFactory("EntryPointTest");
        const entryPoint = await EntryPoint.deploy();
        bic = await BicTokenPaymaster.deploy(ethers.ZeroAddress, entryPoint.target);
        handlerController = await HandlerController.deploy(bicPermissionsEnumerable.target, bic.target);
        await handlerController.waitForDeployment();
        await usernameHandles.setController(handlerController.target);

        ({deployer, wallet1, wallet2, wallet3} = await getEOAAccounts());
        await handlerController.setVerifier(wallet3.address);

        await handlerController.setPrices([ethers.parseEther('1'), ethers.parseEther('0.5'), ethers.parseEther('0.1'), ethers.parseEther('0.05')]);
    });

    it('Controller: create nft directly', async function () {
        await bic.mintTokens(wallet1.address, ethers.parseEther('1000'));
        await bic.connect(wallet1).approve(handlerController.target, ethers.parseEther('1000'));
        const mintName = 'test'
        const dataHash = await handlerController.getRequestHandlerOp(wallet1.address, usernameHandles.target, mintName, [wallet2.address], 0, false);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlerController.connect(wallet1).requestHandler(wallet1.address, usernameHandles.target, mintName, [wallet2.address], 0, false, signature);
        const tokenId = await usernameHandles.getTokenId(mintName);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(wallet1.address);
    });

    it('Controller: commit to mint nft', async function () {
        await bic.mintTokens(wallet1.address, ethers.parseEther('1000'));
        await bic.connect(wallet1).approve(handlerController.target, ethers.parseEther('1000'));
        const mintName = 'test'
        const dataHash = await handlerController.getRequestHandlerOp(wallet1.address, usernameHandles.target, mintName, [wallet2.address], 60*60*24*30, false);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlerController.connect(wallet1).requestHandler(wallet1.address, usernameHandles.target, mintName, [wallet2.address], 60*60*24*30, false, signature);
        const commitTime = await handlerController.commitments(dataHash);
        const tokenId = await usernameHandles.getTokenId(mintName);
        try {
            await usernameHandles.ownerOf(tokenId);
            expect.fail();
        } catch (e) {
            expect(e.message).to.contain('ERC721: invalid token ID');
        }
        await ethers.provider.send('evm_increaseTime', [Number(commitTime)]);
        await handlerController.connect(wallet1).requestHandler(wallet1.address, usernameHandles.target, mintName, [wallet2.address], 60*60*24*30, false, signature);
        expect(await usernameHandles.ownerOf(tokenId)).to.equal(wallet1.address);
    })
});
