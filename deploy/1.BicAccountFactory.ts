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

    await hre.run("verify:verify", {
        contract: "contracts/smart-wallet/BicAccountFactory.sol:BicAccountFactory",
        address: bicAccountFactory.address,
        constructorArguments: [entryPoint.address, bicPermissions.address],
    });

};
func.tags = ["BicAccountFactory"];
func.dependencies = ["EntryPoint", "BicPermissions"];
export default func;