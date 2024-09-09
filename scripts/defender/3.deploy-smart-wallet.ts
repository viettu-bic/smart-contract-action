import {defender, ethers} from "hardhat";
import {defenderOptions, entryPoint, masterOwner} from "./setup";

const operator = masterOwner;

async function main() {
    const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");
    const bicAccountFactory = await defender.deployContract(BicAccountFactory, [entryPoint, operator], defenderOptions as any);
    await bicAccountFactory.waitForDeployment();
    console.log("BicAccountFactory deployed to:", bicAccountFactory.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
