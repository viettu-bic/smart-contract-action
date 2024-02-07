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
    await execute("HandlesController", {from: deployer}, "setVerifier",'0x42F1202e97EF9e9bEeE57CF9542784630E5127A7' /* 0xedd4ecd052dc1cb15f94238f16e26dadc9b2778d8b7250c2025b01d155fef9c8 */);
    await execute("HandlesController", {from: deployer},"setPrices",['1000000000000000000', '1000000000000000000', '1000000000000000000', '1000000000000000000', '1000000000000000000', '100000000000000000', '50000000000000000', '10000000000000000']);
    console.log('End setting verifier and prices');
}

func.tags = ["HandlesController"];
func.dependencies = ["BicPermissions"];
export default func;
