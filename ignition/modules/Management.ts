import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";

const Management = buildModule('Management', (m) => {
    const bicPermissions = m.contract('BicPermissions', []);
    return {bicPermissions};
});
export default Management;
