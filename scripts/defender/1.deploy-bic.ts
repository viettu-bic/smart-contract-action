import {defender, ethers} from "hardhat";
import {defenderOptions, entryPoint, masterOwner} from "./setup";

async function main() {
    const BicTokenPaymaster = await ethers.getContractFactory("BicTokenPaymaster");
    const bicTokenPaymaster = await defender.deployContract(BicTokenPaymaster, [entryPoint, masterOwner], defenderOptions as any);
    await bicTokenPaymaster.waitForDeployment();
    console.log("BicTokenPaymaster deployed to:", bicTokenPaymaster.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
