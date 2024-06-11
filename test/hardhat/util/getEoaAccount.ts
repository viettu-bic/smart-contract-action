import {ethers} from "hardhat";

export async function getEOAAccounts() {
    const [deployer, wallet1, wallet2, wallet3, wallet4] = await ethers.getSigners();
    return { deployer, wallet1, wallet2, wallet3, wallet4 };
}
