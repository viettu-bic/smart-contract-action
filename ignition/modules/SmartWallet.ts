import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import Management from "./Management";

const entryPointAddress = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'

const SmartWallet = buildModule('SmartWallet', (m) => {
    const {bicPermissions} = m.useModule(Management);
    const bicAccountFactory = m.contract('BicAccountFactory', [entryPointAddress, bicPermissions]);
    const bicTokenPaymaster = m.contract('BicTokenPaymaster', [bicAccountFactory, entryPointAddress]);
    return {bicAccountFactory, bicTokenPaymaster};
});
export default SmartWallet;
