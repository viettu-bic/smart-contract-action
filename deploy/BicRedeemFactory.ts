import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, bic } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const bicRedeemFactory = await deploy("BicRedeemFactory", {
    from: deployer,
    args: [],
  });

  try {
    await hre.run("verify:verify", {
      contract: "contracts/token-redeem/BicRedeemFactory.sol:BicRedeemFactory",
      address: bicRedeemFactory.address,
      constructorArguments: [],
    });
  } catch (error) {
    console.log("Verify BicRedeemFactory error with %s", error?.message || "unknown");
    // console.error(error);
  }

};
func.tags = ["BicRedeemFactory"];
func.dependencies = [];
export default func;
