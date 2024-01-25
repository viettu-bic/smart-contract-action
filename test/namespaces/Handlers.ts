import {getEOAAccounts} from "../util/getEoaAccount";
import {ethers} from "hardhat";

describe('Handlers', function () {
    let bicPermissionsEnumerable;
    let bicHandlers;
    let handleTokenURI;

    let deployer;
    let wallet1;
    let wallet2;
    let wallet3;

    before(async () => {
        const GintoNordFontSVG = await ethers.getContractFactory('GintoNordFontSVG');
        const gintoNordFontSVG = await GintoNordFontSVG.deploy();
        const HandleSVG = await ethers.getContractFactory('HandleSVG', {libraries: {GintoNordFontSVG: gintoNordFontSVG.target}});
        const handleSVG = await HandleSVG.deploy();

        const BicPermissionsEnumerable = await ethers.getContractFactory('BicPermissions');
        const Handlers = await ethers.getContractFactory('BicHandlers');
        const HandleTokenURI = await ethers.getContractFactory('HandleTokenURI', {libraries: {HandleSVG: handleSVG.target}});
        bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
        await bicPermissionsEnumerable.waitForDeployment();
        bicHandlers = await Handlers.deploy(bicPermissionsEnumerable.target);
        await bicHandlers.waitForDeployment();
        handleTokenURI = await HandleTokenURI.deploy();
        await handleTokenURI.waitForDeployment();
        await bicHandlers.setHandleTokenURIContract(handleTokenURI.target);

        ({deployer, wallet1, wallet2, wallet3} = await getEOAAccounts());

        await bicPermissionsEnumerable.grantRole(await bicPermissionsEnumerable.OPERATOR_ROLE(), wallet1.address);
    });

    it('should create nft successfully', async function () {
        const createTx = await bicHandlers.connect(wallet1).mintHandle(wallet2.address, 'test');
        const nftId = createTx
        console.log('nftId', nftId);
    });
})
