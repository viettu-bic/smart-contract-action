import {DeployFunction} from "hardhat-deploy/types";
import {HardhatRuntimeEnvironment} from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get} = deployments;
    const { deployer } = await getNamedAccounts();

    const bicPermissions = await get("BicPermissions");
    const handlesController = await deploy("HandlesController", {
        from: deployer,
        args: [bicPermissions.address],

    });

    console.log('deployed HandlesController to: ', handlesController.address);

    try {
        await hre.run("verify:verify", {
            contract: "contracts/handles/HandlesController.sol:HandlesController",
            address: handlesController.address,
            constructorArguments: [bicPermissions.address],
        });
    } catch (error) {
        console.log("Verify HandlesController error with %s", error?.message || "unknown");
    }


}

func.tags = ["HandlesController"];
func.dependencies = ["BicPermissions"];
export default func;
