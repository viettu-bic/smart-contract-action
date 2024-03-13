import {ethers} from "hardhat";
import {parseEther, Wallet} from "ethers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import {expect} from "chai";
import {deploy} from "@openzeppelin/hardhat-upgrades/dist/utils";
describe('ClaimWithoutBic', () => {
    const {provider} = ethers;

    let admin, beneficiary;
    let entryPoint;
    let entryPointAddress;
    let bicPermissions;
    let bicPermissionsAddress;
    let bicAccountFactory;
    let bicAccountFactoryAddress;
    let bicTokenPaymaster;
    let legacyTokenPaymasterAddress;
    let tree;

    let simpleClaim;
    let user1: Wallet = new ethers.Wallet("0x0000000000000000000000000000000000000000000000000000000000000001", provider)
    let user2: Wallet = new ethers.Wallet("0x0000000000000000000000000000000000000000000000000000000000000002", provider)

    beforeEach(async () => {
        [admin, beneficiary] = await ethers.getSigners();
        beneficiary = ethers.Wallet.createRandom().address;
        [admin] = await ethers.getSigners();
        const EntryPoint = await ethers.getContractFactory("EntryPointTest");
        entryPoint = await EntryPoint.deploy();
        await entryPoint.waitForDeployment();
        entryPointAddress = await entryPoint.getAddress();

        const BicPermissions = await ethers.getContractFactory("BicPermissions");
        bicPermissions = await BicPermissions.deploy();
        await bicPermissions.waitForDeployment();
        bicPermissionsAddress = await bicPermissions.getAddress();

        const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");
        bicAccountFactory = await BicAccountFactory.deploy(entryPointAddress, bicPermissionsAddress);
        await bicAccountFactory.waitForDeployment();
        bicAccountFactoryAddress = await bicAccountFactory.getAddress();

        const BicTokenPaymaster = await ethers.getContractFactory("BicTokenPaymaster");
        bicTokenPaymaster = await BicTokenPaymaster.deploy(bicAccountFactoryAddress, entryPointAddress);
        await bicTokenPaymaster.waitForDeployment();
        legacyTokenPaymasterAddress = await bicTokenPaymaster.getAddress();

        await entryPoint.depositTo(legacyTokenPaymasterAddress as any, { value: parseEther('1000') } as any)

        const values = [
            [0, admin.address.toLowerCase(), 100],
            [1, user1.address.toLowerCase(), 100],
            [2, user2.address.toLowerCase(), 200],
        ]
        // const hashedLeafs = [
        //     ethers.solidityPackedKeccak256(["uint256", "address", "uint256"], [0, user1.address, 100]),
        //     ethers.solidityPackedKeccak256(["uint256", "address", "uint256"], [1, user2.address, 200]),
        // ]
        tree = StandardMerkleTree.of(values, ["uint256", "address", "uint256"])
        const SimpleClaim = await ethers.getContractFactory('SimpleClaim');
        simpleClaim = await SimpleClaim.deploy(tree.root, legacyTokenPaymasterAddress);
        bicTokenPaymaster.transfer(simpleClaim.address, parseEther('1000'));
        await simpleClaim.waitForDeployment();
    });

    it('should be able to claim', async () => {
        for (const [i, v] of tree.entries()) {
            if (v[1] === admin.address.toLowerCase()) {
                // (3)
                const proof = tree.getProof(i);
                console.log('Value:', v);
                console.log('Proof:', proof);
                console.log('user1:', admin.address);
                await simpleClaim.connect(admin).claim(proof, v[0], v[2]);
                expect(await simpleClaim.balanceOf(admin.address)).to.equal(v[2]);
            }
        }
        // const proof = tree.getProof(0)

    });

    // it('user 1 with zero native token can claim', async () => {
    //    // native token balance of user 1
    //      expect(await provider.getBalance(user1.address)).to.equal(0);
    //      for (const [i, v] of tree.entries()) {
    //          if (v[1] === user1.address.toLowerCase()) {
    //              // (3)
    //              const proof = tree.getProof(i);
    //              console.log('Value:', v);
    //              console.log('Proof:', proof);
    //              console.log('user1:', user1.address);
    //              const tx = await simpleClaim.connect(user1).claim(proof, v[0], v[2]);
    //              console.log('tx: ', tx);
    //              expect(await simpleClaim.balanceOf(user1.address)).to.equal(v[2]);
    //          }
    //      }
    // });
});
