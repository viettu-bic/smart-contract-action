// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

// import {BicRedeemToken} from "./../../contracts/token-redeem/BicTokenRedeem.sol";
import {BicRedeemToken} from "./../../contracts/token-redeem/BicRedeemToken.sol";

contract BicRedeemTokenTest is Test {
    BicRedeemToken public redeemToken;
    address constant dummyErc20Address = address(1); // Dummy ERC20 address for testing
    address constant beneficiaryAddress = address(2); // Dummy beneficiary address for testing

    function setUp() public {
        redeemToken = new BicRedeemToken();
        // redeemToken.initialize(dummyErc20Address, totalAmount, beneficiaryAddress, 1, 1); // Initial dummy initialization
    }

    function testFuzzInitialize(uint256 totalAmount, uint64 durationSeconds, uint64 redeemRateNumber) public {
        // Validate inputs to avoid divide by zero or overflows
        if (totalAmount == 0 || redeemRateNumber == 0 || redeemRateNumber > 100_000 || durationSeconds == 0) return;
        if (durationSeconds > type(uint64).max / 100_000) return;
        // Re-initialize to apply fuzzed inputs
        redeemToken.initialize(dummyErc20Address, totalAmount, beneficiaryAddress, durationSeconds, redeemRateNumber);

        // Expected values calculation
        uint64 expectedCount = 100_000 / redeemRateNumber;
        uint64 expectedEnd = uint64(block.timestamp) + expectedCount * durationSeconds;
        if (100_000 % redeemRateNumber > 0) {
            expectedEnd += durationSeconds; // Adjusting the end time if there's a remainder
        }

        // Assertions to verify correct calculations
//        assertEq(redeemToken.count(), expectedCount, "Count does not match expected value");
        assertEq(redeemToken.redeemRate(), redeemRateNumber, "Redeem rate does not match the input value");
        assertEq(redeemToken.end(), expectedEnd, "End timestamp does not match expected value");
    }
}
