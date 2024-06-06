import { ethers, run } from "hardhat";

async function main() {
  const [deployer, wallet1] = await ethers.getSigners();
  console.log("🚀 ~ main ~ deployer:", deployer.address)
  console.log("🚀 ~ main ~ deployer:", wallet1.address)
  const marketplaceAddress = "0x3b350161c2Ffb449F5e58DD665d7d8943cC40B93"
  const forwarderAddress = "0xFDa7273F55817a7235abc12C0da5eac10F932c3C"
  const bicTokenAddress = "0xE8AFce87993Bd475FAf2AeA62e0B008Dc27Ab81A"
  const bicForwarder = await ethers.getContractAt("BicForwarder", forwarderAddress);
  const marketplace = await ethers.getContractAt("TestMarketplace", marketplaceAddress);
  const bicToken = await ethers.getContractAt("TestERC20", bicTokenAddress);

  // const bicForwarder = await ethers.deployContract("BicForwarder");
  // const testMarketplace = await ethers.deployContract("TestMarketplace");
  // const testERC20 = await ethers.deployContract("TestERC20");
  // await bicForwarder.waitForDeployment();
  // await testMarketplace.waitForDeployment();
  // await testERC20.waitForDeployment();




  try {
    await run("verify:verify", {
      address: bicForwarder.target,
      constructorArguments: [],
    });
  } catch (error) {
    console.log("Verify BicForwarder error with %s", error?.message || "unknown");
  }

  const bidAmount = ethers.parseEther("50");
  const bidData = marketplace.interface.encodeFunctionData("bidInAuction", [0, bidAmount]);
  console.log("🚀 ~ main ~ bidData:", bidData)

  const balance = await bicToken.balanceOf(wallet1.address);
  console.log("🚀 ~ main ~ balance:", balance)

  const approveTx = await bicToken.connect(wallet1).approve(marketplaceAddress, bidAmount);
  console.log("🚀 ~ main ~ approveTx:", approveTx.hash)
  await approveTx.wait();

  const tx = await bicForwarder.forwardRequest({
    from: wallet1.address,
    to: marketplace.target,
    data: bidData,
    value: 0
  });
  console.log("🚀 ~ main ~ tx:", tx)
  // https://sepolia.arbiscan.io/tx/0x893abe461dd658d8c31becb87734af558d4c6e951bf9a7e242f5aab9c48f6993
  // const auction = await marketplace.auctions(0);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
