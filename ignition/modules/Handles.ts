import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";
import BicTokenPaymaster from "./BicTokenPaymaster";
import {operator} from "./constant";

const Handles = buildModule('Handles', (m) => {
    const {bicTokenPaymaster} = m.useModule(BicTokenPaymaster);

    const handles = m.contract('Handles', []);

    const handleTokenURI = m.contract('HandleTokenURI', [operator]);

    const handlesController = m.contract('HandlesController', [bicTokenPaymaster, operator]);
    return {handles, handleTokenURI, handlesController};
});

export default Handles;
