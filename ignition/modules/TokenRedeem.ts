import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";

const TokenRedeem = buildModule('TokenRedeem', (m) => {
    const tokenRedeem = m.contract('TokenRedeem', []);
    return {tokenRedeem};
});
export default TokenRedeem;
