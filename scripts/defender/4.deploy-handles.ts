import {defender, ethers} from "hardhat";
import {bicTokenPaymaster, defenderOptions} from "./setup";

async function main() {
    const HandleTokenURI = await ethers.getContractFactory("HandleTokenURI");
    const handleTokenURI = await defender.deployContract(HandleTokenURI, [], defenderOptions as any);
    await handleTokenURI.waitForDeployment();
    console.log("HandleTokenURI deployed to:", handleTokenURI.target);

    const Handles = await ethers.getContractFactory("Handles");
    const handle = await defender.deployContract(Handles, [], defenderOptions as any);
    await handle.waitForDeployment();
    console.log("Handles deployed to:", handle.target);

    const BicForwarder = await ethers.getContractFactory("BicForwarder");
    const bicForwarder = await defender.deployContract(BicForwarder, [], defenderOptions as any);
    await bicForwarder.waitForDeployment();
    console.log("BicForwarder deployed to:", bicForwarder.target);

    const HandlesController = await ethers.getContractFactory("HandlesController");
    const handlesController = await defender.deployContract(HandlesController, [bicTokenPaymaster], defenderOptions as any);
    await handlesController.waitForDeployment();
    console.log("HandlesController deployed to:", handlesController.target);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
