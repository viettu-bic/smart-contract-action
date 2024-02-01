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

    beforeEach(async () => {
        const GintoNordFontSVG = await ethers.getContractFactory('GintoNordFontSVG');
        const gintoNordFontSVG = await GintoNordFontSVG.deploy();
        const HandleSVG = await ethers.getContractFactory('HandleSVG', {libraries: {GintoNordFontSVG: gintoNordFontSVG.target}});
        const handleSVG = await HandleSVG.deploy();

        const BicPermissionsEnumerable = await ethers.getContractFactory('BicPermissions');
        const UsernameHandlers = await ethers.getContractFactory('UsernameHandlers');
        const HandlerController = await ethers.getContractFactory('HandlerController');
        bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
        await bicPermissionsEnumerable.waitForDeployment();
        usernameHandlers = await UsernameHandlers.deploy(bicPermissionsEnumerable.target);
        await usernameHandlers.waitForDeployment();
        handlerController = await HandlerController.deploy(bicPermissionsEnumerable.target);
        await handlerController.waitForDeployment();
        await usernameHandlers.setController(handlerController.target);

        ({deployer, wallet1, wallet2, wallet3} = await getEOAAccounts());
        await handlerController.setVerifier(wallet3.address);
    });

    it('Controller: create nft directly', async function () {
        const mintName = 'test'
        const dataHash = await handlerController.getRequestHandlerOp(wallet1.address, usernameHandlers.target, mintName, [wallet2.address], 0, true);
        const signature = await wallet3.signMessage(ethers.getBytes(dataHash));
        await handlerController.connect(wallet1).requestHandler(wallet1.address, usernameHandlers.target, mintName, [wallet2.address], 0, true, signature);
        expect(1).to.equal(1);
    });
});
