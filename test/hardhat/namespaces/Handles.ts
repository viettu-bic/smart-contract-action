import {getEOAAccounts} from "../util/getEoaAccount";
import {ethers} from "hardhat";
import {expect} from "chai";

describe('Handles', function () {
    let bicPermissionsEnumerable;
    let bicHandles;
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
        const Handles = await ethers.getContractFactory('UsernameHandles');
        const HandleTokenURI = await ethers.getContractFactory('HandleTokenURI', {libraries: {HandleSVG: handleSVG.target}});
        bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
        await bicPermissionsEnumerable.waitForDeployment();
        bicHandles = await Handles.deploy(bicPermissionsEnumerable.target);
        await bicHandles.waitForDeployment();
        handleTokenURI = await HandleTokenURI.deploy();
        await handleTokenURI.waitForDeployment();
        await bicHandles.setHandleTokenURIContract(handleTokenURI.target);

        ({deployer, wallet1, wallet2, wallet3} = await getEOAAccounts());

        await bicHandles.setController(wallet1.address);
    });

    it('Handles: should create nft successfully', async function () {
        const mintName = 'testt'
        await bicHandles.connect(wallet1).mintHandle(wallet2.address, mintName);
        const tokenId = await bicHandles.getTokenId(mintName);
        const exists = await bicHandles.exists(tokenId);
        expect(exists).to.equal(true);
        const uri = await bicHandles.tokenURI(tokenId);
        const owner = await bicHandles.ownerOf(tokenId);
        expect(owner).to.equal(wallet2.address);

        const handleNamespace = await bicHandles.getHandle(tokenId);
        const namespace = await bicHandles.getNamespace();
        expect(handleNamespace).to.equal(namespace + '/@' + mintName);
    });

    it('Handles: should not create nft if not controller', async function () {
        const mintName = 'testt'
        await expect(bicHandles.connect(wallet2).mintHandle(wallet2.address, mintName)).to.be.revertedWithCustomError(bicHandles,'NotController');
    });

    it('Handles: should not create nft if exists', async function () {
        const mintName = 'testt'
        await bicHandles.connect(wallet1).mintHandle(wallet2.address, mintName);
        await expect(bicHandles.connect(wallet1).mintHandle(wallet2.address, mintName)).to.be.revertedWith('ERC721: token already minted');
    });

    it('Handles: should not create nft if name too short', async function () {
        const mintName = 't'
        await expect(bicHandles.connect(wallet1).mintHandle(wallet2.address, mintName)).to.be.revertedWithCustomError(bicHandles,'HandleLengthInvalid');
    });

    it('Handles: should not create nft if name too long', async function () {
        const mintName = 'testasdadsdasdsadcxzcdasdsfcsascadsfdsfhajkschcdsancadsbdbsjvbadbksvjadsfdasfakdjlfkdajfldsjfkadjflakdjsfdsja'
        await expect(bicHandles.connect(wallet1).mintHandle(wallet2.address, mintName)).to.be.revertedWithCustomError(bicHandles,'HandleLengthInvalid');
    });

    it('Handles: should not create nft if name invalid', async function () {
        const mintName = 'testt@'
        await expect(bicHandles.connect(wallet1).mintHandle(wallet2.address, mintName)).to.be.revertedWithCustomError(bicHandles,'HandleContainsInvalidCharacters');
    });

    describe('Burn', function () {
       it('Handles: should burn nft successfully', async function () {
              const mintName = 'testt'
              await bicHandles.connect(wallet1).mintHandle(wallet2.address, mintName);
              const tokenId = await bicHandles.getTokenId(mintName);
               const existsBeforeBurn = await bicHandles.exists(tokenId);
               expect(existsBeforeBurn).to.equal(true);
              await bicHandles.connect(wallet2).burn(tokenId);
              const existsAfterBurn = await bicHandles.exists(tokenId);
              expect(existsAfterBurn).to.equal(false);
              await expect(bicHandles.getLocalName(tokenId)).to.be.revertedWithCustomError(bicHandles,'DoesNotExist');
       });

       it('Handles: should not burn nft if not owner', async function () {
              const mintName = 'testt'
              await bicHandles.connect(wallet1).mintHandle(wallet2.address, mintName);
              const tokenId = await bicHandles.getTokenId(mintName);
              await expect(bicHandles.connect(wallet3).burn(tokenId)).to.be.revertedWithCustomError(bicHandles,'NotOwner');
       });
    });
})
