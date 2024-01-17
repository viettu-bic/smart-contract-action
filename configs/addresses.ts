import { HardhatRuntimeEnvironment } from "hardhat/types";


const config: {
    [network: string]: any;
} = {

};

export default async function (hre: HardhatRuntimeEnvironment): Promise<any> {
    const { getChainId } = hre;


}
