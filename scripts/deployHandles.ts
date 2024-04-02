import { ethers, run } from "hardhat";

const nameNftList = [
    {
        namespace: 'ounft',
        name: "Ownership Username NFT",
        symbol: "ouNFT",
        imageDescription: "Beincom - Ownership Username@",
        imageUri: "https://api.beincom.io/v1/wallet/uri/ounft",
    },
    {
        namespace: 'ocnft',
        name: "Ownership Community Name NFT",
        symbol: "ocNFT",
        imageDescription: "Beincom - Ownership Community Name@",
        imageUri: "https://api.beincom.io/v1/wallet/uri/ocnft",
    },
    {
        namespace: 'opnft',
        name: "Ownership Personal Name NFT",
        symbol: "opNFT",
        imageDescription: "Beincom - Ownership Personal Name@",
        imageUri: "https://api.beincom.io/v1/wallet/uri/opnft",
    },
    {
        namespace: 'eunft',
        name: "Earning Username NFT",
        symbol: "euNFT",
        imageDescription: "Beincom - Earning Username@",
        imageUri: "https://api.beincom.io/v1/wallet/uri/eunft",
    },
    {
        namespace: 'ecnft',
        name: "Earning Community Name NFT",
        symbol: "ecNFT",
        imageDescription: "Beincom - Earning Community Name@",
        imageUri: "https://api.beincom.io/v1/wallet/uri/ecnft",
    },
    {
        namespace: 'epnft',
        name: "Earning Personal Name NFT",
        symbol: "epNFT",
        imageDescription: "Beincom - Earning Personal Name@",
        imageUri: "https://api.beincom.io/v1/wallet/uri/epnft",
    },
]

async function main() {
    const bicFactory = await ethers.getContractAt("BicFactory", "0xD162557458de4210a06f8cf72aB31C54Ed97c920");
    const handles = await ethers.getContractAt("Handles", "0xc08de1A6C48c2da1B5DdC7F14d97962e17098615");

    // const HandleTokenURI = await ethers.getContractFactory("HandleTokenURI");
    // const handleTokenURI = await HandleTokenURI.deploy("0xB4f594F5EB0C327b94d102dF44ebc7b6981001e0");
    // await handleTokenURI.waitForDeployment();

    const handleTokenURI = await ethers.getContractAt("HandleTokenURI", "0x685016e18d685Fc71194d9FC55b4E4c6f8b6a539");

    console.log("🚀 ~ handleTokenURI:", handleTokenURI.target);
    try {
        await run("verify:verify", {
            address: handleTokenURI.target,
            constructorArguments: ["0xB4f594F5EB0C327b94d102dF44ebc7b6981001e0"],
        });
    } catch (error) {
        console.log("Verify HandleTokenURI error with %s", error?.message || "unknown");
    }

    const callDataAllHandles = nameNftList.map((nameNft) => {
        return handles.interface.encodeFunctionData('initialize', [nameNft.namespace, nameNft.name, nameNft.symbol, "0xeaBcd21B75349c59a4177E10ed17FBf2955fE697"]);
    });

    for (const nameNft of nameNftList) {
        console.log('Clone handle for namespace: ', nameNft.namespace)
        const txCloneHandle = await bicFactory.deployProxyByImplementation(
            handles.target as any,
            handles.interface.encodeFunctionData('initialize', [nameNft.namespace, nameNft.name, nameNft.symbol, "0xeaBcd21B75349c59a4177E10ed17FBf2955fE697"]) as any,
            ethers.solidityPackedKeccak256(['string', 'string', 'uint256'], ['Handles', nameNft.namespace, 1]) as any
        );
        const txCloneHandleReceipt = await txCloneHandle.wait();
        const cloneAddress = txCloneHandleReceipt?.logs[txCloneHandleReceipt?.logs.length - 1].args[1];
        console.log('cloneAddress: ', cloneAddress)
        const clone = await ethers.getContractAt("Handles", cloneAddress);
        await clone.setHandleTokenURIContract(handleTokenURI.target as any);
        await clone.setController("0x211e4656C4EC9B76D48101eDb46F3C066E8E761D");
        await handleTokenURI.setNameElement(nameNft.namespace as any, nameNft.imageDescription as any, nameNft.imageUri as any);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});