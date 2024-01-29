import { ethers, run } from "hardhat";

async function main() {
    const bicAccountAddress = '0xcf4B075dab2c0F2e12B9F197695398221984F978'
    const BicAccount = await ethers.getContractFactory("BicAccount");

    await run("verify:verify", {
        address: bicAccountAddress,
        constructorArguments: ['0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'],
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
