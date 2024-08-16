import { ethers, run } from "hardhat";

async function main() {
  const [deployer, wallet1, wallet2] = await ethers.getSigners();
  console.log("🚀 ~ file: deploy.ts:5 ~ main ~ deployer:", deployer.address);


  const paymentService = await ethers.deployContract("PaymentService", []);
  await paymentService.waitForDeployment();

  console.log("🚀 paymentService :", paymentService.target);

  await run("verify:verify", {
    address: paymentService.target,
    constructorArguments: [],
});

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
