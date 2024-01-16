
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const test = await deploy("EntryPoint", {
        from: deployer,
        args: [],
    });
    console.log("🚀 ~ EntryPoint:", test.address)


};
func.tags = ["EntryPoint"]
func.dependencies = []
export default func;