import { ethers } from "hardhat";
import { getEOAAccounts } from "../util/getEoaAccount";
import { expect } from "chai";

import { Handles, HandleTokenURI } from "../../../typechain-types";


describe('HandleTokenURI', function () {
    let handle: Handles;
    let handleURI: HandleTokenURI;
    const baseUri = "https://api.beincom.app/v1/wallet/uri/ounft";

    before(async () => {
        const { deployer, wallet1, wallet2, wallet3, wallet4 } = await getEOAAccounts();

        const Handles = await ethers.getContractFactory('Handles');
        handle = await Handles.deploy();
        await handle.waitForDeployment();
        await handle.initialize(
            "ounft",
            "Ownership Username",
            "ounft",
            deployer.address
        );


        const HandleTokenURI = await ethers.getContractFactory('HandleTokenURI');
        handleURI = await HandleTokenURI.deploy(deployer.address);
        await handleURI.waitForDeployment();


        await handle.setHandleTokenURIContract(handleURI.target);

        const namespace = await handle.getNamespace();
        await handleURI.setNameElement(
            namespace,
            "Beincom - Ownership Username",
            baseUri,
        )


    });

    it("should set the token URI", async function () {
        const { deployer } = await getEOAAccounts();

        const localName = "Local name abc";
        const mintTx = await handle.mintHandle(deployer.address, localName);
        await mintTx.wait();

        const tokenId = await handle.getTokenId(localName);

        const data = await handle.tokenURI(tokenId);
        const decodedData = JSON.parse(atob(data.split(',')[1]));

        expect(decodedData.image).to.equal(`https://api.beincom.app/v1/wallet/uri/ounft/${tokenId.toString()}`);
    });


});
