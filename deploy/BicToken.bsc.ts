// import { DeployFunction } from "hardhat-deploy/types";
// import { HardhatRuntimeEnvironment } from "hardhat/types";

// const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   const { deployments, getNamedAccounts } = hre;
//   const { deploy } = deployments;
//   const { deployer } = await getNamedAccounts();

//   console.log("deployer: ", deployer);

//   const bicToken = await deploy("BicToken", {
//     from: deployer,
//     args: [],
//   });

//   console.log("🚀 ~ bicToken:", bicToken.address);
// };

// func.tags = ["BicToken"];
// export default func;
