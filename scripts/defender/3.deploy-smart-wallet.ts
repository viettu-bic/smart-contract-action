import {defender, ethers} from "hardhat";
import {defenderOptions, entryPoint} from "./setup";

const operator = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

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
