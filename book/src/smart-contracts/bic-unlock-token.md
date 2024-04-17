
# Bic Unlock ERC20 Token
## Overview

The `BicUnlockToken` smart contract is designed for managing the gradual and conditional release of ERC20 tokens to a designated beneficiary. This contract ensures that tokens are vested over a specified duration according to a predetermined rate, enhancing security and predictability for token distribution processes. This document details the functionalities, methods, and use-cases of the `BicUnlockToken` contract.

## Key Features

-   **Reentrancy Guard**: Protects against reentrancy attacks.
-   **Initializable**: Ensures the contract can only be initialized once.
-   **SafeERC20**: Safeguards interactions with ERC20 tokens.
-   **Scheduled Token Release**: Tokens are released to the beneficiary based on a vesting schedule defined by duration and rate.

## State Variables

-   `_erc20`: The address of the ERC20 token contract involved in the vesting.
-   `_beneficiary`: Address of the beneficiary receiving the vested tokens.
-   `_totalAmount`: The total amount of tokens to be vested.
-   `_start`: The start time of the vesting period.
-   `_end`: The end time of the vesting period.
-   `_duration`: Duration of each vesting interval in seconds.
-   `_unlockRate`: Fraction of total tokens to be released per duration interval.
-   `_maxRewardStacks`: Maximum number of intervals for the vesting.
-   `_currentRewardStacks`: Current count of intervals that have completed.
-   `_released`: Amount of tokens that have been released so far.

## Functions

### Constructor

Sets initial values for state variables. The constructor is made payable to allow it to accept Ether, although it does not handle Ether transactions directly.

### initialize

**Purpose**: Initializes the contract with necessary parameters for vesting.

-   Parameters: `erc20Address`, `totalAmount`, `beneficiaryAddress`, `durationSeconds`, `unlockRateNumber`
-   Access: Public and can only be called once (initializer).

### release

**Purpose**: Releases the vested tokens available up to the current timestamp.

-   Access: Public
-   Emits: `ERC20Released` event indicating the amount released and the current reward stacks.

### Public View Functions

Several view functions provide information about the current state of the vesting:

-   `erc20()`: Returns the ERC20 token address.
-   `unlockTotalAmount()`: Returns the total amount of tokens to be vested.
-   `unlockRate()`: Returns the unlock rate per duration.
-   `beneficiary()`: Returns the beneficiary address.
-   `start()`: Returns the vesting start timestamp.
-   `end()`: Returns the vesting end timestamp.
-   `duration()`: Returns the duration of each vesting interval.
-   `lastAtCurrentStack()`: Returns the timestamp of the last interval completion.
-   `maxRewardStacks()`: Returns the maximum number of reward intervals.
-   `currentRewardStacks()`: Returns the current interval count.
-   `amountPerDuration()`: Calculates the amount of tokens released per interval.
-   `released()`: Returns the amount of tokens that have been released so far.
-   `releasable()`: Calculates the amount of tokens that can be released as of the current timestamp.

## Usage Example

```ts
	// NOTE: Should use BicUnlockFactory to create BicUnlockToken
	const unlockAddress = await bicUnlockFactory.createUnlock(
        "0xERC20Address",
        totalAmount,
        beneficiary.address,
		duration,
        speedRateNumber,
    );
	const bicUnlockToken = await ethers.getContractAt(
        "BicUnlockToken",
        unlockAddress
    );
	// Assume: Passed duration
	bicUnlockToken.release();
``` 
