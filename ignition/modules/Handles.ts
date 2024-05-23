import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import Infra from "./Infra";
import SmartWallet from "./SmartWallet";
import Management from "./Management";

const Handles = buildModule('Handle', (m) => {
    const {bicTokenPaymaster} = m.useModule(SmartWallet);
    const {bicPermissions} = m.useModule(Management);

    const handles = m.contract('Handles', []);

    const handleTokenURI = m.contract('HandleTokenURI', [bicPermissions]);

    const handlesController = m.contract('HandlesController', [bicPermissions, bicTokenPaymaster]);
    return {handles, handleTokenURI, handlesController};
});

export default Handles;
