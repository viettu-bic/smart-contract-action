import { ethers } from "hardhat";

const contractFixture = async () => {
    /**
     * deployer: The account use for deploying the contract
     * user1: EOA wallet for user1
     * user2: EOA wallet for user2
     * beneficiary: EOA wallet for all beneficiary
     */
    const [deployer, user1, user2, beneficiary] = await ethers.getSigners();

    /**
     * EntryPoint
     */
    const entryPoint = await ethers.deployContract("EntryPoint");
    await entryPoint.waitForDeployment();

    /**
     * BicPermissionsEnumerable
     */
    const bicPermissionsEnumerable = await ethers.deployContract("BicPermissions");
    await bicPermissionsEnumerable.waitForDeployment();

    /**
     * BicAccountFactory
     */
    const bicAccountFactory = await ethers.deployContract("BicAccountFactory", [entryPoint.target, bicPermissionsEnumerable.target]);
    await bicAccountFactory.waitForDeployment();

    /**
     * Implementation V2
     */
    const bicAccountV2 = await ethers.deployContract("BicAccount2", [entryPoint.target]);
    await bicAccountV2.waitForDeployment();

    return {
        deployer, user1, user2, beneficiary, entryPoint, bicPermissionsEnumerable, bicAccountFactory, bicAccountV2
    }
}

export { contractFixture }