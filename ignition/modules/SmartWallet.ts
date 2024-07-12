import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import {entryPointAddress} from "./constant";

const SmartWallet = buildModule('SmartWallet', (m) => {
    const bicAccountFactory = m.contract('BicAccountFactory', [entryPointAddress, process.env.BIC_DEFAULT_OPERATOR]);
    return {bicAccountFactory};
});
export default SmartWallet;
