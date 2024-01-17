import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const bicPermissions = await deploy("BicPermissions", {
        from: deployer,
        args: [],
    });
    console.log("🚀 ~ BicPermissions:", bicPermissions.address)

    await hre.run("verify:verify", {
        contract: "contracts/management/BicPermissions.sol:BicPermissions",
        address: bicPermissions.address,
        constructorArguments: [],
    });


};
func.tags = ["BicPermissions"]
func.dependencies = []
export default func;