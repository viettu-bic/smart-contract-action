
# Bic Unlock Factory

  

## Overview

- The **BicUnlockFactory** is a Solidity smart contract designed to manage the deployment and administration of individual unlock contracts for ERC20 tokens using a factory pattern. This design pattern facilitates the creation of multiple instances of a specific contract type, in this case, the **BicUnlockToken**, which governs the conditional release of tokens based on predefined criteria.

- The primary goal of the **BicUnlockFactory** is to allow users to set up contracts that gradually unlock ERC20 tokens for a designated beneficiary over a specified duration and at a defined rate. Each beneficiary can have only one active unlock contract at any time, ensuring uniqueness and manageability.

  

## State Variables

- **bicUnlockImplementation** (immutable): Stores the address of the implementation contract used for clones.

- **unlockAddress** (mapping): Maps a beneficiary's address to their corresponding unlock contract address.

## Events
- **UnlockInitialized**: Emitted after successfully initializing a new unlock contract. It logs important parameters like contract address, token address, total amount, beneficiary, duration, and rate.
## Errors
- *Unlock contract already deploy*: Each beneficiary can have only one active unlock contract at any time


  

### Functions

#### Constructor

- BicUnlockFactory Constructor: Instantiates the **bicUnlockImplementation** with a new **BicUnlockToken**.

#### createUnlock
*Purpose: Creates a new unlock contract if one doesn't already exist for the beneficiary.*
-   Calculates a unique hash for the parameters.
-   Predicts the deterministic address where the new unlock contract will exist.
-   Checks if the contract code already exists at the predicted address.
-   If not, clones the `bicUnlockImplementation` contract using the calculated hash.
-   Initializes the new unlock contract with the specified parameters.
-   Transfers the specified amount of tokens from the message sender to the newly created contract.
-   Updates the `unlockAddress` mapping and emits the `UnlockInitialized` event.

#### computeUnlock
*Purpose: Computes the address of a potential or existing unlock contract for given parameters without creating it.*
- Checks if an unlock address already exists for the beneficiary.
- If not, calculates the hash and uses it to predict the deterministic address.

#### _getHash
*Purpose: Generates a hash from the input parameters using `keccak256`*
- Encodes the parameters and hashes them to create a unique identifier.


## Usage Example
```ts
    const  beneficiary = ethers.Wallet.createRandom(ethers.provider);
    const  speedRateNumber = ethers.toBigInt(ethers.parseUnits("2".toString(), 3));
	const  duration = dayjs.duration(1, "weeks").asSeconds();
    const  totalAmount = ethers.parseUnits("4000", 18);
    const  stacksExpect = BigInt(Math.floor(DENOMINATOR / Number(speedRateNumber)));
	const  totalDurations =  (stacksExpect + BigInt(bufferStack(Number(speedRateNumber)))) * BigInt(duration);
	const  unlockAddress = await  bicUnlockFactory.computeUnlock(
        "0xERC20Address",
        totalAmount,
        beneficiary.address,
        duration,
        speedRateNumber,
	);
	const createTx = await  bicUnlockFactory.createUnlock(
        "0xERC20Address",
        totalAmount,
        beneficiary.address,
        duration,
        speedRateNumber,
    );
```
    
