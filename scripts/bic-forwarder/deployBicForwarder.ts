import { ethers, run } from "hardhat";

async function main() {
  const [deployer, wallet1] = await ethers.getSigners();
  console.log("🚀 ~ main ~ deployer:", deployer.address)
  console.log("🚀 ~ main ~ deployer:", wallet1.address)
  const marketplaceAddress = "0x3b350161c2Ffb449F5e58DD665d7d8943cC40B93"
  const forwarderAddress = "0xFDa7273F55817a7235abc12C0da5eac10F932c3C"
  const bicTokenAddress = "0xE8AFce87993Bd475FAf2AeA62e0B008Dc27Ab81A"
  const testERC721Address = "0xB1F4A5D4D5e31f3d0Ad7caD25583BC0c6D639bb9";
  const testHandlesControllerAddress = "0xd817b7aa36f352067d815364cf241056ad86afa1";
  const bicForwarder = await ethers.getContractAt("BicForwarder", forwarderAddress);
  const marketplace = await ethers.getContractAt("TestMarketplace", marketplaceAddress);
  const bicToken = await ethers.getContractAt("TestERC20", bicTokenAddress);
  const test721 = await ethers.getContractAt("TestERC721", testERC721Address);
  const testHandlesController = await ethers.getContractAt("TestHandlesController", testHandlesControllerAddress);


  // const TestERC721 = await ethers.getContractFactory("TestERC721");
  // const test721 = await TestERC721.deploy();
  // console.log("🚀 ~ main ~ test721:", test721)
  // await test721.waitForDeployment();

  // const TestHandlesController = await ethers.getContractFactory("TestHandlesController");
  // const testHandlesController = await TestHandlesController.deploy(bicTokenAddress, testERC721Address, marketplaceAddress, forwarderAddress);
  // console.log("🚀 ~ main ~ testHandlesController:", testHandlesController)
  // await testHandlesController.waitForDeployment();




  try {
    await run("verify:verify", {
      address: bicForwarder.target,
      constructorArguments: [],
    });
    await run("verify:verify", {
      address: testHandlesController.target,
      constructorArguments: [bicTokenAddress, testERC721Address, marketplaceAddress, forwarderAddress],
    });
    await run("verify:verify", {
      address: test721.target,
      constructorArguments: [],
    });
  } catch (error) {
    console.log("Verify BicForwarder error with %s", error?.message || "unknown");
  }

  const startPrice = ethers.parseEther("12.612");



  const balance = await bicToken.balanceOf(wallet1.address);
  console.log("🚀 ~ main ~ balance:", balance)

  // const approveTx = await bicToken.connect(wallet1).approve(marketplace.target, ethers.MaxUint256);
  // console.log("🚀 ~ main ~ approveTx:", approveTx.hash)
  // await approveTx.wait();

  
  const createAuctionAndBidTx = await testHandlesController.connect(wallet1).createAuction(startPrice);
  console.log("🚀 ~ main ~ createAuctionAndBidTx:", createAuctionAndBidTx.hash)
  await createAuctionAndBidTx.wait()

  
  // https://sepolia.arbiscan.io/tx/0x893abe461dd658d8c31becb87734af558d4c6e951bf9a7e242f5aab9c48f6993
  // const auction = await marketplace.auctions(0);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
