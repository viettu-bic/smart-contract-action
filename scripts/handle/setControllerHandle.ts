import hre from "hardhat";


async function main() {
    const handlesController = await hre.ethers.getContractAt("HandlesController", "0xEae14c7e330AD0a095463CfC9Ea36A289123158E");
    const handles = [
        "0xad82ca7dc001d5d38622cdeca92624173eb18937",
        "0xa0cf6F69F847D062414792d8AC0BA879d2a85735",
        "0x6e8fF86585149dEC7FebFd34f67c29a8905b046d",
        "0x94cE32d9fFDDcF623EDAf1eBDDf5b1B6a67Fac00",
        "0xf5c4C84929B084BBC1e2FaF5458a89b5320688DC",
        "0xa405fd6123d664fC2fb06D08E34f32964B66f317",
    ];

    for await (const handleAddress of handles) { 
        const handle = await hre.ethers.getContractAt("Handles", handleAddress);
        const setTx = await handle.setController(handlesController.target);
        console.log("🚀 ~ forawait ~ setTx:", setTx.hash)
        await setTx.wait();
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
