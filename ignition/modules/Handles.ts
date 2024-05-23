import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import Infra from "./Infra";
import SmartWallet from "./SmartWallet";
import Management from "./Management";

const Handles = buildModule('Handles', (m) => {
    const {bicTokenPaymaster} = m.useModule(SmartWallet);
    const {bicPermissions} = m.useModule(Management);

    const handles = m.contract('Handles', []);

    const handleTokenURI = m.contract('HandleTokenURI', [bicPermissions]);

    const handlesController = m.contract('HandlesController', [bicPermissions, bicTokenPaymaster]);
    // const handlesController = m.contract('HandlesController', ['0xB4f594F5EB0C327b94d102dF44ebc7b6981001e0', '0xE8AFce87993Bd475FAf2AeA62e0B008Dc27Ab81A']);
    return {handles, handleTokenURI, handlesController};
});

export default Handles;
