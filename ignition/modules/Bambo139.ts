import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import {entryPointAddress, operator} from "./constant";

const Bambo139 = buildModule('Bambo139', (m) => {
    const bambo139 = m.contract('Bambo139', [entryPointAddress, operator]);
    return {bambo139};
});
export default Bambo139;
