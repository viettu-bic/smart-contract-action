import {defender, ethers} from "hardhat";
import {defenderOptions} from "./setup";

async function main() {
    const BicFactory = await ethers.getContractFactory("BicFactory");
    const bicFactory = await defender.deployContract(BicFactory, [], defenderOptions as any);
    await bicFactory.waitForDeployment();
    console.log("BicFactory deployed to:", bicFactory.target);

    const BicRedeemFactory = await ethers.getContractFactory("BicRedeemFactory");
    const bicRedeemFactory = await defender.deployContract(BicRedeemFactory, [], defenderOptions as any);
    await bicRedeemFactory.waitForDeployment();
    console.log("BicRedeemFactory deployed to:", bicRedeemFactory.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
