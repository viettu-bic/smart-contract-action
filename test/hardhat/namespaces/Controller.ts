import {ethers} from "hardhat";
import {getEOAAccounts} from "../util/getEoaAccount";
import {expect} from "chai";


describe('Controller', function () {
    let deployer;
    let wallet1;
    let wallet2;
    let wallet3;

    let bicPermissionsEnumerable;
    let usernameHandlers;
    let handlerController;
    let bic;

    beforeEach(async () => {
        const GintoNordFontSVG = await ethers.getContractFactory('GintoNordFontSVG');
        const gintoNordFontSVG = await GintoNordFontSVG.deploy();
        const HandleSVG = await ethers.getContractFactory('HandleSVG', {libraries: {GintoNordFontSVG: gintoNordFontSVG.target}});
        const handleSVG = await HandleSVG.deploy();

        const BicPermissionsEnumerable = await ethers.getContractFactory('BicPermissions');
        const UsernameHandlers = await ethers.getContractFactory('UsernameHandlers');
        const HandlerController = await ethers.getContractFactory('HandlerController');
        const BicTokenPaymaster = await ethers.getContractFactory('BicTokenPaymaster');
        bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
        await bicPermissionsEnumerable.waitForDeployment();
        usernameHandlers = await UsernameHandlers.deploy(bicPermissionsEnumerable.target);
        await usernameHandlers.waitForDeployment();

        const EntryPoint = await ethers.getContractFactory("EntryPointTest");
        const entryPoint = await EntryPoint.deploy();
        bic = await BicTokenPaymaster.deploy(ethers.ZeroAddress, entryPoint.target);
        handlerController = await HandlerController.deploy(bicPermissionsEnumerable.target, bic.target);
        await handlerController.waitForDeployment();
        await usernameHandlers.setController(handlerController.target);

        ({deployer, wallet1, wallet2, wallet3} = await getEOAAccounts());
        await handlerController.setVerifier(wallet3.address);

        await handlerController.setPrices([ethers.parseEther('1'), ethers.parseEther('0.5'), ethers.parseEther('0.1'), ethers.parseEther('0.05')]);
    });

    it('Controller: create nft directly', async function () {
        await bic.mintTokens(wallet1.address, ethers.parseEther('1000'));
        await bic.connect(wallet1).approve(handlerController.target, ethers.parseEther('1000'));
        const mintName = 'test'
        const dataHash = await handlerController.getRequestHandlerOp(wallet1.address, usernameHandlers.target, mintName, [wallet2.address], 0, true);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlerController.connect(wallet1).requestHandler(wallet1.address, usernameHandlers.target, mintName, [wallet2.address], 0, true, signature);
        const tokenId = await usernameHandlers.getTokenId(mintName);
        expect(await usernameHandlers.ownerOf(tokenId)).to.equal(wallet1.address);
    });
});
