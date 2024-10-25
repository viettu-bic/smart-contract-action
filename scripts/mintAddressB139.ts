import {entryPoint} from "./defender/setup";

const hre = require("hardhat");

async function main() {
    // Get the contract factory
    const Contract = await hre.ethers.getContractFactory("Bambo139");

    // Prepare the constructor arguments
    const args = [entryPoint, process.env.BIC_DEFAULT_OPERATOR];

    // Get the bytecode combined with constructor arguments
    const bytecodeWithArgs = (await Contract.getDeployTransaction(...args)).data;

    // Get signer (the account making the transaction)
    const [deployer] = await hre.ethers.getSigners();


    // ABI of the external contract (must include the performCreate function)
    const createCallABI = [
        "function performCreate(uint256 value, bytes memory deploymentData) public returns (address newContract)",
        "function performCreate2(uint256 value, bytes memory deploymentData, bytes32 salt) public returns (address newContract)",

    ];

    // Connect to the contract using the ABI and address
    const createCall = new hre.ethers.Contract('0x762fcf49c5ef21510755191bbed6aa2a702f0348', createCallABI, deployer);
    while (true) {

        const salt = hre.ethers.randomBytes(32);

        // Compute the address of the new contract
        const computedAddress = computeCreate2Address(createCall.target, salt, bytecodeWithArgs);

        // if(true) {
        if(computedAddress.toLowerCase().includes('0xb139')) {
            console.log('salt: ', hre.ethers.hexlify(salt))
            console.log('computedAddress: ', computedAddress)
        }
    }

}

function computeCreate2Address(senderAddress, saltHex, deploymentData) {
    const bytecodeHash = hre.ethers.keccak256(deploymentData);
    const computedAddress = hre.ethers.getCreate2Address(senderAddress, saltHex, bytecodeHash);
    return computedAddress;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
