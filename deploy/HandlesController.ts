import {DeployFunction} from "hardhat-deploy/types";
import {HardhatRuntimeEnvironment} from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get, execute} = deployments;
    const { deployer } = await getNamedAccounts();

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
    console.log('Start setting verifier and prices');
    await execute("HandlesController", {from: deployer}, "setVerifier",'0x42F1202e97EF9e9bEeE57CF9542784630E5127A7');
    await execute("HandlesController", {from: deployer},"setCollector","0xC9167C15f539891B625671b030a0Db7b8c08173f");
    console.log('End setting verifier and prices');
}

func.tags = ["HandlesController"];
func.dependencies = ["BicPermissions"];
export default func;
