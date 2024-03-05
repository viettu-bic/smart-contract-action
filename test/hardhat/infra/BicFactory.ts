import {ethers} from "hardhat";
import {expect} from "chai";

describe('BicFactory', function () {
    let bicFactory;

    beforeEach(async () => {
        const BicFactory = await ethers.getContractFactory('BicFactory');
        bicFactory = await BicFactory.deploy();
        await bicFactory.waitForDeployment();
    });

it('BicFactory: can deploy ERC20', async function () {
        const TestErc20Constructor = await ethers.getContractFactory('TestErc20Constructor');
        const token1 = await TestErc20Constructor.deploy('Token1', 'TK1');
        await token1.waitForDeployment();

        const token2 = await TestErc20Constructor.deploy('Token2', 'TK2');
        await token2.waitForDeployment();

        expect(await token1.name()).to.equal('Token1');
        expect(await token2.name()).to.equal('Token2');
    });
})
