import { ethers, defender } from "hardhat";

const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

async function main() {
    const BicTokenPaymaster = await ethers.getContractFactory("BicTokenPaymaster");
    const bicTokenPaymaster = await defender.deployContract(BicTokenPaymaster, [entryPoint], {
        salt: "0",
        licenseType: "GNU GPLv3",
    });
    await bicTokenPaymaster.waitForDeployment();
    console.log("BicTokenPaymaster deployed to:", bicTokenPaymaster.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
