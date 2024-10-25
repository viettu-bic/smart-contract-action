import {entryPoint} from "./defender/setup";

const hre = require("hardhat");

async function main() {
    // Get the contract factory
    const Contract = await hre.ethers.getContractFactory("Bambo139");

    // Prepare the constructor arguments
    const args = [entryPoint, process.env.BIC_DEFAULT_OPERATOR];

    // Get the bytecode combined with constructor arguments
    const bytecodeWithArgs = (await Contract.getDeployTransaction(...args)).data;

    console.log("Deployment data (bytecode with args):", bytecodeWithArgs);

    // Get signer (the account making the transaction)
    const [deployer] = await hre.ethers.getSigners();


    // ABI of the external contract (must include the performCreate function)
    const createCallABI = [
        "function performCreate(uint256 value, bytes memory deploymentData) public returns (address newContract)"
    ];

    // Connect to the contract using the ABI and address
    const createCall = new hre.ethers.Contract('0x762fcf49c5ef21510755191bbed6aa2a702f0348', createCallABI, deployer);

    // Call the performCreate function
    const tx = await createCall.performCreate(0, bytecodeWithArgs);
    console.log('tx: ', tx)
    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    // Output the new contract address created by performCreate
    console.log("New contract created at:", receipt);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
