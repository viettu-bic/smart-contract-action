import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get, execute } = deployments;
    const { deployer, verifier, collector } = await getNamedAccounts();

    const bicPermissions = await get("BicPermissions");
    const bicTokenPaymaster = await get("BicTokenPaymaster");
    const handlesController = await deploy("HandlesController", {
        from: deployer,
        args: [bicPermissions.address, bicTokenPaymaster.address],

    });

    console.log('deployed HandlesController to: ', handlesController.address);

    try {
        await hre.run("verify:verify", {
            contract: "contracts/namespaces/controller/HandlesController.sol:HandlesController",
            address: handlesController.address,
            constructorArguments: [bicPermissions.address, bicTokenPaymaster.address],
        });
    } catch (error) {
        console.log("Verify HandlesController error with %s", error?.message || "unknown");
    }
    console.log('Start setting verifier and collector');
    await execute("HandlesController", { from: deployer }, "setVerifier", verifier);
    await execute("HandlesController", { from: deployer }, "setCollector", collector);
    console.log('End setting verifier and prices');
}

func.tags = ["HandlesController"];
func.dependencies = ["BicPermissions", "BicTokenPaymaster"];
export default func;
