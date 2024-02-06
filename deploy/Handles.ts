import {DeployFunction} from "hardhat-deploy/types";
import {HardhatRuntimeEnvironment} from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get} = deployments;
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
            contract: "contracts/handles/UsernameHandles.sol:UsernameHandles",
            address: usernameHandles.address,
            constructorArguments: [bicPermissions.address],
        });
    } catch (error) {
        console.log("Verify UsernameHandles error with %s", error?.message || "unknown");
    }

    try {
        await hre.run("verify:verify", {
            contract: "contracts/handles/CommunityNameHandles.sol:CommunityNameHandles",
            address: communityNameHandles.address,
            constructorArguments: [bicPermissions.address],
        });
    } catch (error) {
        console.log("Verify CommunityNameHandles error with %s", error?.message || "unknown");
    }

    try {
        await hre.run("verify:verify", {
            contract: "contracts/handles/EarningUsernameHandles.sol:EarningUsernameHandles",
            address: earningUsernameHandles.address,
            constructorArguments: [bicPermissions.address],
        });
    } catch (error) {
        console.log("Verify EarningUsernameHandles error with %s", error?.message || "unknown");
    }

    try {
        await hre.run("verify:verify", {
            contract: "contracts/handles/EarningCommunityNameHandles.sol:EarningCommunityNameHandles",
            address: earningCommunityNameHandles.address,
            constructorArguments: [bicPermissions.address],
        });
    } catch (error) {
        console.log("Verify EarningCommunityNameHandles error with %s", error?.message || "unknown");
    }
}
func.tags = ["Handles"];
func.dependencies = ["HandlesController"];
export default func;
