import { ethers, run } from "hardhat";

async function main() {
    const GintoNordFontSVG = await ethers.getContractFactory('GintoNordFontSVG');
    const gintoNordFontSVG = await GintoNordFontSVG.deploy();
    await gintoNordFontSVG.waitForDeployment();

    await run("verify:verify", {
        address: gintoNordFontSVG.target,
        constructorArguments: [],
    });

    const HandleSVG = await ethers.getContractFactory('HandleSVG', {libraries: {GintoNordFontSVG: gintoNordFontSVG.target}});
    const handleSVG = await HandleSVG.deploy();
    await handleSVG.waitForDeployment();

    await run("verify:verify", {
        address: handleSVG.target,
        constructorArguments: [],
    });


    const BicPermissionsEnumerable = await ethers.getContractFactory('BicPermissions');
    const Handles = await ethers.getContractFactory('BicHandles');
    const bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
    await bicPermissionsEnumerable.waitForDeployment();

    await run("verify:verify", {
        address: bicPermissionsEnumerable.target,
        constructorArguments: [],
    });

    await bicPermissionsEnumerable.waitForDeployment();
    const bicHandles = await Handles.deploy(bicPermissionsEnumerable.target);
    await bicHandles.waitForDeployment();

    await run("verify:verify", {
        address: bicHandles.target,
        constructorArguments: [bicPermissionsEnumerable.target],
    });

    // const bicHandles = await ethers.getContractAt('BicHandles', '0xc36aC179Ce11A934bc44F94c0C0Efc1a14722569');

    const HandleTokenURI = await ethers.getContractFactory('HandleTokenURI', {libraries: {HandleSVG: handleSVG.target}});
    // const HandleTokenURI = await ethers.getContractFactory('HandleTokenURI', {libraries: {HandleSVG: '0x9a8a6c7b5aa96b717329679ec697f5f84ae92d91'}});
    const handleTokenURI = await HandleTokenURI.deploy();
    await handleTokenURI.waitForDeployment();

    await run("verify:verify", {
        address: handleTokenURI.target,
        constructorArguments: [],
    });

    await bicHandles.setHandleTokenURIContract(handleTokenURI.target as any);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
