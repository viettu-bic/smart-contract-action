import {DeployFunction} from "hardhat-deploy/types";
import {HardhatRuntimeEnvironment} from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get, execute } = deployments;
    const { deployer } = await getNamedAccounts();

    const bicPermissions = await get("BicPermissions");
    const usernameHandles = await deploy("UsernameHandles", {
        from: deployer,
        args: [bicPermissions.address],
    });
    console.log('deployed UsernameHandles to: ', usernameHandles.address);

    const communityNameHandles = await deploy("CommunityNameHandles", {
        from: deployer,
        args: [bicPermissions.address],
    });
    console.log('deployed CommunityNameHandles to: ', communityNameHandles.address);

    const earningUsernameHandles = await deploy("EarningUsernameHandles", {
        from: deployer,
        args: [bicPermissions.address],
    });
    console.log('deployed EarningUsernameHandles to: ', earningUsernameHandles.address);

    const earningCommunityNameHandles = await deploy("EarningCommunityNameHandles", {
        from: deployer,
        args: [bicPermissions.address],
    });
    console.log('deployed EarningCommunityNameHandles to: ', earningCommunityNameHandles.address);

    try {
        await hre.run("verify:verify", {
            contract: "contracts/namespaces/UsernameHandles.sol:UsernameHandles",
            address: usernameHandles.address,
            constructorArguments: [bicPermissions.address],
        });
    } catch (error) {
        console.log("Verify UsernameHandles error with %s", error?.message || "unknown");
    }

    try {
        await hre.run("verify:verify", {
            contract: "contracts/namespaces/CommunityNameHandles.sol:CommunityNameHandles",
            address: communityNameHandles.address,
            constructorArguments: [bicPermissions.address],
        });
    } catch (error) {
        console.log("Verify CommunityNameHandles error with %s", error?.message || "unknown");
    }

    try {
        await hre.run("verify:verify", {
            contract: "contracts/namespaces/earning/EarningUsernameHandles.sol:EarningUsernameHandles",
            address: earningUsernameHandles.address,
            constructorArguments: [bicPermissions.address],
        });
    } catch (error) {
        console.log("Verify EarningUsernameHandles error with %s", error?.message || "unknown");
    }

    try {
        await hre.run("verify:verify", {
            contract: "contracts/namespaces/earning/EarningCommunityNameHandles.sol:EarningCommunityNameHandles",
            address: earningCommunityNameHandles.address,
            constructorArguments: [bicPermissions.address],
        });
    } catch (error) {
        console.log("Verify EarningCommunityNameHandles error with %s", error?.message || "unknown");
    }

    const handlesController = await get("HandlesController");
    console.log('Starting to set controller for handles')
    await execute("UsernameHandles", {from: deployer}, "setController", handlesController.address);
    await execute("CommunityNameHandles", {from: deployer}, "setController", handlesController.address);
    await execute("EarningUsernameHandles", {from: deployer}, "setController", handlesController.address);
    await execute("EarningCommunityNameHandles", {from: deployer}, "setController", handlesController.address);
    console.log('Finished setting controller for handles')
}
func.tags = ["Handles"];
func.dependencies = ["HandlesController"];
export default func;
