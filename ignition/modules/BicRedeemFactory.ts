import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";

const BicRedeemFactory = buildModule('BicRedeemFactory', (m) => {
    const bicRedeemFactory = m.contract('BicRedeemFactory', []);
    return {bicRedeemFactory};
});
export default BicRedeemFactory;
