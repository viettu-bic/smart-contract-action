import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import {entryPointAddress, operator} from "./constant";

const BicTokenPaymaster = buildModule('BicTokenPaymaster', (m) => {
    const bicTokenPaymaster = m.contract('BicTokenPaymaster', [entryPointAddress, operator]);
    return {bicTokenPaymaster};
});
export default BicTokenPaymaster;
