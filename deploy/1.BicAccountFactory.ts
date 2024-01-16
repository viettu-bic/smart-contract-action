import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const entryPoint = await get("EntryPoint");
    const bicPermissions = await get("BicPermissions");
    const bicAccountFactory = await deploy("BicAccountFactory", {
        from: deployer,
        args: [entryPoint.address, bicPermissions.address],
    });
    console.log("🚀 ~ bicAccountFactory:", bicAccountFactory.address)

};
func.tags = ["BicAccountFactory"];
func.dependencies = ["EntryPoint", "BicPermissions"];
export default func;