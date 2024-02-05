import {getEOAAccounts} from "../util/getEoaAccount";
import {ethers} from "hardhat";
import {expect} from "chai";

describe('Handlers', function () {
    let bicPermissionsEnumerable;
    let bicHandlers;
    let handleTokenURI;

    let deployer;
    let wallet1;
    let wallet2;
    let wallet3;

    beforeEach(async () => {
        const GintoNordFontSVG = await ethers.getContractFactory('GintoNordFontSVG');
        const gintoNordFontSVG = await GintoNordFontSVG.deploy();
        const HandleSVG = await ethers.getContractFactory('HandleSVG', {libraries: {GintoNordFontSVG: gintoNordFontSVG.target}});
        const handleSVG = await HandleSVG.deploy();

        const BicPermissionsEnumerable = await ethers.getContractFactory('BicPermissions');
        const Handlers = await ethers.getContractFactory('UsernameHandlers');
        const HandleTokenURI = await ethers.getContractFactory('HandleTokenURI', {libraries: {HandleSVG: handleSVG.target}});
        bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
        await bicPermissionsEnumerable.waitForDeployment();
        bicHandlers = await Handlers.deploy(bicPermissionsEnumerable.target);
        await bicHandlers.waitForDeployment();
        handleTokenURI = await HandleTokenURI.deploy();
        await handleTokenURI.waitForDeployment();
        await bicHandlers.setHandleTokenURIContract(handleTokenURI.target);

        ({deployer, wallet1, wallet2, wallet3} = await getEOAAccounts());

        await bicHandlers.setController(wallet1.address);
    });

    it('Handlers: should create nft successfully', async function () {
        const mintName = 'test'
        await bicHandlers.connect(wallet1).mintHandle(wallet2.address, mintName);
        const tokenId = await bicHandlers.getTokenId(mintName);
        const exists = await bicHandlers.exists(tokenId);
        expect(exists).to.equal(true);
        const uri = await bicHandlers.tokenURI(tokenId);
        const owner = await bicHandlers.ownerOf(tokenId);
        expect(owner).to.equal(wallet2.address);
    });

    describe('Burn', function () {
       it('Handlers: should burn nft successfully', async function () {
              const mintName = 'test'
              await bicHandlers.connect(wallet1).mintHandle(wallet2.address, mintName);
              const tokenId = await bicHandlers.getTokenId(mintName);
               const existsBeforeBurn = await bicHandlers.exists(tokenId);
               expect(existsBeforeBurn).to.equal(true);
              await bicHandlers.connect(wallet2).burn(tokenId);
              const existsAfterBurn = await bicHandlers.exists(tokenId);
              expect(existsAfterBurn).to.equal(false);
       });

       it('Handlers: should not burn nft if not owner', async function () {
              const mintName = 'test'
              await bicHandlers.connect(wallet1).mintHandle(wallet2.address, mintName);
              const tokenId = await bicHandlers.getTokenId(mintName);
              await expect(bicHandlers.connect(wallet3).burn(tokenId)).to.be.reverted;
       });
    });
})
