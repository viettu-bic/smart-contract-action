import {Contract, Signer, Wallet} from "ethers";
import {ethers, upgrades} from "hardhat";
import {expect} from "chai";

describe("BicAccountUUPS", () => {
   it('should upgrade the contract', async () => {
       const [admin] = await ethers.getSigners();

       const EntryPoint = await ethers.getContractFactory("EntryPointTest");
       const entryPoint = await EntryPoint.deploy();
       await entryPoint.waitForDeployment();
       const entryPointAddress = await entryPoint.getAddress();

      const BicAccount1 = await ethers.getContractFactory("BicAccount1");
      const bicAccount1 = await upgrades.deployProxy(BicAccount1, [admin.address], {
          constructorArgs: [entryPointAddress],
         unsafeAllow: ["constructor", "state-variable-immutable"]
      });
        await bicAccount1.waitForDeployment();
        const bicAccount1Address = await bicAccount1.getAddress();

        // @ts-ignore
        const version = await bicAccount1.version();
        console.log('version', version);
       // @ts-ignore
        console.log('info', await bicAccount1.info())

        const BicAccount2 = await ethers.getContractFactory("BicAccount2");
        const bicAccount2 = await upgrades.upgradeProxy(bicAccount1Address, BicAccount2, {
            constructorArgs: [entryPointAddress],
            unsafeAllow: ["constructor", "state-variable-immutable"]
        });
        await bicAccount2.waitForDeployment();
        const bicAccount2Address = await bicAccount2.getAddress();

        // @ts-ignore
        const version2 = await bicAccount2.version();
        console.log('version2', version2);
       // @ts-ignore
       console.log('info', await bicAccount2.info())
   });
});
