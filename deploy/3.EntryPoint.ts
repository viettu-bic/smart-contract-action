
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const entryPoint = await deploy("EntryPoint", {
        from: deployer,
        args: [],
    });

    await hre.run("verify:verify", {
        contract: "@account-abstraction/contracts/core/EntryPoint.sol:EntryPoint",
        address: entryPoint.address,
        constructorArguments: [],
    });

};
func.tags = ["EntryPoint"]
func.dependencies = []
export default func;