import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import SmartWallet from "./SmartWallet";

const Handles = buildModule('Handles', (m) => {
    const {bicTokenPaymaster} = m.useModule(SmartWallet);

    const handles = m.contract('Handles', []);

    const handleTokenURI = m.contract('HandleTokenURI', []);

    const handlesController = m.contract('HandlesController', [bicTokenPaymaster]);
    return {handles, handleTokenURI, handlesController};
});

export default Handles;
