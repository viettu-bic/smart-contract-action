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
