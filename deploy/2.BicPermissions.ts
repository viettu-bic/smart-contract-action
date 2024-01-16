import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const test = await deploy("BicPermissions", {
        from: deployer,
        args: [],
    });
    console.log("🚀 ~ BicPermissions:", test.address)


};
func.tags = ["BicPermissions"]
func.dependencies = []
export default func;