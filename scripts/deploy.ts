import hre, {ethers} from "hardhat";

import HandleModule from "../ignition/modules/Handles";
import Infra from "../ignition/modules/Infra";
import TokenRedeem from "../ignition/modules/TokenRedeem";

const nameNftList = [
    {
        namespace: 'ounft',
        name: "Ownership Username NFT",
        symbol: "ouNFT",
        imageDescription: "Beincom - Ownership Username@",
        imageUri: "https://api.beincom.app/v1/wallet/uri/ounft",
    },
    {
        namespace: 'ocnft',
        name: "Ownership Community Name NFT",
        symbol: "ocNFT",
        imageDescription: "Beincom - Ownership Community Name@",
        imageUri: "https://api.beincom.app/v1/wallet/uri/ocnft",
    },
    {
        namespace: 'opnft',
        name: "Ownership Personal Name NFT",
        symbol: "opNFT",
        imageDescription: "Beincom - Ownership Personal Name@",
        imageUri: "https://api.beincom.io/v1/wallet/uri/opnft",
    },
    {
        namespace: 'bunft',
        name: "Base Username NFT",
        symbol: "buNFT",
        imageDescription: "Beincom - Base Username@",
        imageUri: "https://api.beincom.app/v1/wallet/uri/eunft",
    },
    {
        namespace: 'bcnft',
        name: "Base Community Name NFT",
        symbol: "bcNFT",
        imageDescription: "Beincom - Base Community Name@",
        imageUri: "https://api.beincom.app/v1/wallet/uri/ecnft",
    },
    {
        namespace: 'bpnft',
        name: "Base Personal Name NFT",
        symbol: "bpNFT",
        imageDescription: "Beincom - Base Personal Name@",
        imageUri: "https://api.beincom.app/v1/wallet/uri/epnft",
    },
]


async function main() {
    if(process.env.IS_DEPLOY_HANDLE) {
        const {handles, handleTokenURI, handlesController} = await hre.ignition.deploy(HandleModule);
        const {bicFactory} = await hre.ignition.deploy(Infra);
        const [deployer] = await ethers.getSigners();

        console.log('Setup handles controller');
        await handlesController.setVerifier(process.env.VERIFIER_ADDRESS || '0x42F1202e97EF9e9bEeE57CF9542784630E5127A7');
        await handlesController.setCollector(process.env.COLLECTOR_ADDRESS || '0xC9167C15f539891B625671b030a0Db7b8c08173f');
        await handlesController.setMarketplace(process.env.MARKETPLACE_ADDRESS || '0x4a4cC4EF2730B6817BaebA59D186A36424CcA64a');
        await handlesController.setAuctionMarketplaceConfig([0n,60n, 100n]) //0 buyout price, 60s time bps, 1% price bps
        console.log('Done setup handle controller');

        for (const nameNft of nameNftList) {
            // Clone handle flow
            console.log('Clone handle for namespace: ', nameNft.namespace)
            const txCloneHandle = await bicFactory.deployProxyByImplementation(
                handles.target as any,
                handles.interface.encodeFunctionData('initialize', [nameNft.namespace, nameNft.name, nameNft.symbol, deployer.address]) as any,
                ethers.solidityPackedKeccak256(['string', 'string', 'uint256'], ['Handles', nameNft.namespace, 0]) as any
            );
            const txCloneHandleReceipt = await txCloneHandle.wait();

            // @ts-ignore
            const cloneAddress = txCloneHandleReceipt?.logs[txCloneHandleReceipt?.logs.length - 1].args[1];
            console.log('cloneAddress: ', cloneAddress)

            // Just update uri for handle flow
            // const cloneAddress = nameNft.address
            const clone = await ethers.getContractAt("Handles", cloneAddress);

            await clone.setHandleTokenURIContract(handleTokenURI.target as any);
            await clone.setController(handlesController.target as any);
            await handleTokenURI.setNameElement(nameNft.namespace as any, nameNft.imageDescription as any, nameNft.imageUri as any);
        }
        console.log('Done setup handles');
    }
    if(process.env.IS_DEPLOY_TOKEN_REDEEM) {
        const {tokenRedeem} = await hre.ignition.deploy(TokenRedeem);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
