import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const Infra = buildModule('Infra', (m) => {
    const bicFactory = m.contract('BicFactory', []);
    return {bicFactory};
});

export default Infra;
