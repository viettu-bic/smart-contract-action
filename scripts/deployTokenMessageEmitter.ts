import { ethers, run } from "hardhat";

async function main() {
  const [deployer, wallet1, wallet2] = await ethers.getSigners();
  console.log("🚀 ~ file: deploy.ts:5 ~ main ~ deployer:", deployer.address);


  const tokenMessageEmitter = await ethers.deployContract("TokenMessageEmitter", []);
  await tokenMessageEmitter.waitForDeployment();

  console.log("🚀 paymentService :", tokenMessageEmitter.target);

  await run("verify:verify", {
    address: tokenMessageEmitter.target,
    constructorArguments: [],
});

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
