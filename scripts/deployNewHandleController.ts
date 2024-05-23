import hre from "hardhat";
import HandleModule from "../ignition/modules/Handles";

async function main() {
    const {handlesController} = await hre.ignition.deploy(HandleModule);
    console.log("🚀 ~ main ~ handlesController:", handlesController.target);
    await handlesController.setVerifier('0x42F1202e97EF9e9bEeE57CF9542784630E5127A7');
    await handlesController.setCollector('0xC9167C15f539891B625671b030a0Db7b8c08173f');
    await handlesController.setMarketplace('0x4a4cC4EF2730B6817BaebA59D186A36424CcA64a');
    await handlesController.setAuctionMarketplaceConfig([0n,60n, 100n]) //0 buyout price, 60s time bps, 1% price bps
    console.log('done setup');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
