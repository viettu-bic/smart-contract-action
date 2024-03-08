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
        const token1 = await TestErc20Constructor.deploy();
        await token1.waitForDeployment();
        await token1.initialize('Token1','TK1');

        const txClone = await bicFactory.deployProxyByImplementation(token1.target, '0x', ethers.ZeroHash);
        const txCloneReceipt = await txClone.wait();
        const cloneAddress = txCloneReceipt.logs[0].args[1];
        const clone = await ethers.getContractAt('TestErc20Constructor', cloneAddress);
        await clone.initialize('Token2','TK2')

        expect(await token1.name()).to.equal('Token1');
        expect(await clone.name()).to.equal('Token2');
        expect(await token1.contractName()).to.equal(await clone.contractName());
    });

    // it('BicFactory: can deploy Handles and Set Controller at once', async function () {
    //     const BicPermissionsEnumerable = await ethers.getContractFactory('BicPermissions');
    //     const bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
    //     await bicPermissionsEnumerable.waitForDeployment();
    //
    //     const Handles = await ethers.getContractFactory('Handles');
    //     const handle = await Handles.deploy(bicPermissionsEnumerable.target, 'bic', 'bic', 'bic');
    //     await handle.waitForDeployment();
    //
    //
    // });
})
