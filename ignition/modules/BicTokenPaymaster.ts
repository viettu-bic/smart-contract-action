import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import {entryPointAddress} from "./constant";

const BicTokenPaymaster = buildModule('BicTokenPaymaster', (m) => {
    const bicTokenPaymaster = m.contract('BicTokenPaymaster', [entryPointAddress]);
    return {bicTokenPaymaster};
});
export default BicTokenPaymaster;
