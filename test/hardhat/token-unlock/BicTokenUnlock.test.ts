import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import {
  BicPermissions,
  TestERC20,
  BicTokenUnlock,
} from "../../../typechain-types";
import { contractFixture } from "../util/fixtures";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { ethers } from "hardhat";

describe("BicTokenUnlock", function () {
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let bicPermissionsEnumerable: BicPermissions;
  let bicToken: TestERC20;
  let bicTokenUnlock: BicTokenUnlock;

  let cycle = 0n;
  let mappedClaim = {
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": {
      claimIds: [
        "1@gmail.com-week-1",
        "1@gmail.com-week-2",
        "1@gmail.com-week-3",
      ],
      claimTimestamps: ["1709714208", "1709714208", "1709714208"],
      claimAmounts: [
        "10000000000000000000",
        "10000000000000000000",
        "10000000000000000000",
      ],
    },
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": {
      claimIds: [
        "2@gmail.com-week-1",
        "2@gmail.com-week-2",
        "2@gmail.com-week-3",
      ],
      claimTimestamps: ["1709714208", "1709714208", "1709714208"],
      claimAmounts: [
        "10000000000000000000",
        "10000000000000000000",
        "10000000000000000000",
      ],
    },
  };

  beforeEach(async () => {
    const {
      deploySigner,
      signer1,
      signer2,
      testERC20Contract,
      bicTokenUnlockContract,
    } = await loadFixture(contractFixture);

    deployer = deploySigner;
    alice = signer1;
    bob = signer2;
    bicToken = testERC20Contract;
    bicTokenUnlock = bicTokenUnlockContract;
  });

  it("should have root updated by admin only", async () => {
    const result = {
      cycle: BigInt(1),
      merkleRoot:
        "0x8826dd8c9add1e979f07812c583f0be71d37b729b945f54bad7cd5b0f89b971e",
    };
    await expect(
      bicTokenUnlock
        .connect(alice)
        .proposeRoot(result.cycle.toString(), result.merkleRoot)
    ).to.be.rejectedWith("only operator");
  });
  it("should fail to update root for bad cycle", async () => {
    const result = {
      cycle: BigInt(1),
      merkleRoot:
        "0x8826dd8c9add1e979f07812c583f0be71d37b729b945f54bad7cd5b0f89b971e",
    };
    await bicTokenUnlock
      .connect(deployer)
      .proposeRoot(result.cycle.toString(), result.merkleRoot);

    await expect(
      bicTokenUnlock
        .connect(deployer)
        .proposeRoot(result.cycle.toString(), result.merkleRoot)
    ).to.be.revertedWith("incorrect cycle");
  });
  it("should revert claim when user not confirm unlock rate", async () => {
    cycle = BigInt((await bicTokenUnlock.getMerkleData()).cycle);
    await bicToken
      .connect(deployer)
      .transfer(bicTokenUnlock.target, ethers.parseEther("1000000"));

    cycle = cycle + BigInt(1);
    //@ts-ignore
    const result = await generateClaim(cycle, mappedClaim);

    await bicTokenUnlock
      .connect(deployer)
      .proposeRoot(result.cycle.toString(), result.merkleRoot);

    for (const [account, userClaim] of Object.entries(result.userClaims)) {
      await expect(
        bicTokenUnlock.connect(deployer).claim(
          // @ts-ignore
          result.cycle,
          account,
          // @ts-ignore
          userClaim.claimIds,
          // @ts-ignore
          userClaim.claimTimestamps,
          // @ts-ignore
          userClaim.claimAmounts,
          // @ts-ignore
          userClaim.proof
        )
      ).to.be.revertedWith("The unlock rate has not been confirmed yet");
    }
  });
  it("should revert for incorrect claimIds, claimTimestamps, claimAmounts", async () => {
    mappedClaim = {
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": {
        claimIds: ["1@gmail.com-week-1", "1@gmail.com-week-2"],
        claimTimestamps: ["1709714208", "1709714208", "1709714208"],
        claimAmounts: [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000",
        ],
      },
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": {
        claimIds: ["2@gmail.com-week-2", "2@gmail.com-week-3"],
        claimTimestamps: ["1709714208", "1709714208", "1709714208"],
        claimAmounts: [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000",
        ],
      },
    };
    cycle = BigInt((await bicTokenUnlock.getMerkleData()).cycle);
    await bicToken
      .connect(deployer)
      .transfer(bicTokenUnlock.target, ethers.parseEther("1000000"));

    cycle = cycle + BigInt(1);
    //@ts-ignore
    const result = await generateClaim(cycle, mappedClaim);

    await bicTokenUnlock
      .connect(deployer)
      .proposeRoot(result.cycle.toString(), result.merkleRoot);

    for (const [account] of Object.entries(result.userClaims)) {
      const isConfirmed = (await bicTokenUnlock.usersData(account)).isConfirmed;
      if (!isConfirmed) {
        await bicTokenUnlock
          .connect(deployer)
          .confirmUnlockRate(account, BigInt("50"));
      }
    }

    for (const [account, userClaim] of Object.entries(result.userClaims)) {
      await expect(
        bicTokenUnlock.connect(deployer).claim(
          // @ts-ignore
          result.cycle,
          account,
          // @ts-ignore
          userClaim.claimIds,
          // @ts-ignore
          userClaim.claimTimestamps,
          // @ts-ignore
          userClaim.claimAmounts,
          // @ts-ignore
          userClaim.proof
        )
      ).to.be.reverted;
    }

    for (const [account] of Object.entries(result.userClaims)) {
      const amount = await bicTokenUnlock.getClaimedAmount(account);
      expect(ethers.formatEther(amount.toString())).equal("0.0");
    }
  });
  it("should claim properly base timestamp and block.timestamp", async () => {
    const now = await time.latest();
    const tmr = now + 86400 * 2;
    mappedClaim = {
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": {
        claimIds: [
          "1@gmail.com-week-1",
          "1@gmail.com-week-2",
          "1@gmail.com-week-3",
        ],
        claimTimestamps: ["1709714208", "1709714208", `${tmr}`],
        claimAmounts: [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000",
        ],
      },
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": {
        claimIds: [
          "2@gmail.com-week-1",
          "2@gmail.com-week-2",
          "2@gmail.com-week-3",
        ],
        claimTimestamps: ["1709714208", "1709714208", `${tmr}`],
        claimAmounts: [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000",
        ],
      },
    };
    cycle = BigInt((await bicTokenUnlock.getMerkleData()).cycle);
    await bicToken
      .connect(deployer)
      .transfer(bicTokenUnlock.target, ethers.parseEther("1000000"));

    cycle = cycle + BigInt(1);
    //@ts-ignore
    const result = await generateClaim(cycle, mappedClaim);

    await bicTokenUnlock
      .connect(deployer)
      .proposeRoot(result.cycle.toString(), result.merkleRoot);

    for (const [account] of Object.entries(result.userClaims)) {
      const isConfirmed = (await bicTokenUnlock.usersData(account)).isConfirmed;
      if (!isConfirmed) {
        await bicTokenUnlock
          .connect(deployer)
          .confirmUnlockRate(account, BigInt("50"));
      }
    }

    for (const [account, userClaim] of Object.entries(result.userClaims)) {
      await bicTokenUnlock.connect(deployer).claim(
        // @ts-ignore
        result.cycle,
        account,
        // @ts-ignore
        userClaim.claimIds,
        // @ts-ignore
        userClaim.claimTimestamps,
        // @ts-ignore
        userClaim.claimAmounts,
        // @ts-ignore
        userClaim.proof
      );
    }

    for (const [account] of Object.entries(result.userClaims)) {
      const amount = await bicTokenUnlock.getClaimedAmount(account);
      expect(ethers.formatEther(amount.toString())).equal("20.0");
    }
  });
  it("should claim with fixed claim amount", async () => {
    mappedClaim = {
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": {
        claimIds: [
          "1@gmail.com-week-1",
          "1@gmail.com-week-2",
          "1@gmail.com-week-3",
        ],
        claimTimestamps: ["1709714208", "1709714208", "1709714208"],
        claimAmounts: [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000",
        ],
      },
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": {
        claimIds: [
          "2@gmail.com-week-1",
          "2@gmail.com-week-2",
          "2@gmail.com-week-3",
        ],
        claimTimestamps: ["1709714208", "1709714208", "1709714208"],
        claimAmounts: [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000",
        ],
      },
    };
    cycle = BigInt((await bicTokenUnlock.getMerkleData()).cycle);
    await bicToken
      .connect(deployer)
      .transfer(bicTokenUnlock.target, ethers.parseEther("1000000"));

    cycle = cycle + BigInt(1);
    //@ts-ignore
    const result = await generateClaim(cycle, mappedClaim);

    await bicTokenUnlock
      .connect(deployer)
      .proposeRoot(result.cycle.toString(), result.merkleRoot);

    for (const [account] of Object.entries(result.userClaims)) {
      const isConfirmed = (await bicTokenUnlock.usersData(account)).isConfirmed;
      if (!isConfirmed) {
        await bicTokenUnlock
          .connect(deployer)
          .confirmUnlockRate(account, BigInt("50"));
      }
    }

    for (const [account, userClaim] of Object.entries(result.userClaims)) {
      await bicTokenUnlock.connect(deployer).claim(
        // @ts-ignore
        result.cycle,
        account,
        // @ts-ignore
        userClaim.claimIds,
        // @ts-ignore
        userClaim.claimTimestamps,
        // @ts-ignore
        userClaim.claimAmounts,
        // @ts-ignore
        userClaim.proof
      );
    }

    for (const [account] of Object.entries(result.userClaims)) {
      const amount = await bicTokenUnlock.getClaimedAmount(account);
      expect(ethers.formatEther(amount.toString())).equal("30.0");
    }
  });
  it("should claim with generated increasing claim cycle", async () => {
    mappedClaim = {
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": {
        claimIds: [
          "1@gmail.com-week-1",
          "1@gmail.com-week-2",
          "1@gmail.com-week-3",
        ],
        claimTimestamps: ["1709714208", "1709714208", "1709714208"],
        claimAmounts: [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000",
        ],
      },
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": {
        claimIds: [
          "2@gmail.com-week-1",
          "2@gmail.com-week-2",
          "2@gmail.com-week-3",
        ],
        claimTimestamps: ["1709714208", "1709714208", "1709714208"],
        claimAmounts: [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000",
        ],
      },
    };
    cycle = BigInt((await bicTokenUnlock.getMerkleData()).cycle);

    await bicToken
      .connect(deployer)
      .transfer(bicTokenUnlock.target, ethers.parseEther("1000000"));
    cycle = cycle + BigInt(1);

    // Week 1
    //@ts-ignore
    const result = await generateClaim(cycle, mappedClaim);
    await bicTokenUnlock
      .connect(deployer)
      .proposeRoot(result.cycle.toString(), result.merkleRoot);

    for (const [account] of Object.entries(result.userClaims)) {
      const isConfirmed = (await bicTokenUnlock.usersData(account)).isConfirmed;
      if (!isConfirmed) {
        await bicTokenUnlock
          .connect(deployer)
          .confirmUnlockRate(account, BigInt("50"));
      }
    }

    for (const [account, userClaim] of Object.entries(result.userClaims)) {
      await bicTokenUnlock.connect(deployer).claim(
        // @ts-ignore
        result.cycle,
        account,
        // @ts-ignore
        userClaim.claimIds,
        // @ts-ignore
        userClaim.claimTimestamps,
        // @ts-ignore
        userClaim.claimAmounts,
        // @ts-ignore
        userClaim.proof
      );
    }

    // Week 2
    cycle = cycle + BigInt(1);
    mappedClaim = {
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": {
        claimIds: [
          "1@gmail.com-week-1",
          "1@gmail.com-week-2",
          "1@gmail.com-week-3",
        ],
        claimTimestamps: ["1709714208", "1709714208", "1709714208"],
        claimAmounts: [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000",
        ],
      },
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": {
        claimIds: [
          "2@gmail.com-week-1",
          "2@gmail.com-week-2",
          "2@gmail.com-week-3",
        ],
        claimTimestamps: ["1709714208", "1709714208", "1709714208"],
        claimAmounts: [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000",
        ],
      },
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906": {
        claimIds: [
          "3@gmail.com-week-1",
          "3@gmail.com-week-2",
          "3@gmail.com-week-3",
        ],
        claimTimestamps: ["1709714208", "1709714208", "1709714208"],
        claimAmounts: [
          "10000000000000000000",
          "10000000000000000000",
          "10000000000000000000",
        ],
      },
    };
    const result2 = await generateClaim(cycle, mappedClaim);
    await bicTokenUnlock
      .connect(deployer)
      .proposeRoot(result2.cycle.toString(), result2.merkleRoot);

    for (const [account] of Object.entries(result2.userClaims)) {
      const isConfirmed = (await bicTokenUnlock.usersData(account)).isConfirmed;
      if (!isConfirmed) {
        await bicTokenUnlock
          .connect(deployer)
          .confirmUnlockRate(account, BigInt("50"));
      }
    }

    for (const [account, userClaim] of Object.entries(result2.userClaims)) {
      await bicTokenUnlock.connect(deployer).claim(
        // @ts-ignore
        result2.cycle,
        account,
        // @ts-ignore
        userClaim.claimIds,
        // @ts-ignore
        userClaim.claimTimestamps,
        // @ts-ignore
        userClaim.claimAmounts,
        // @ts-ignore
        userClaim.proof
      );
    }

    for (const [account] of Object.entries(result2.userClaims)) {
      const amount = await bicTokenUnlock.getClaimedAmount(account);
      expect(ethers.formatEther(amount.toString())).equal("30.0");
    }
  });
});

const generateClaim = async (cycle: BigInt, mappedClaim: any) => {
  const treeElements = await addAccountInMapping(mappedClaim);
  const dataList = [];
  for (const user of treeElements) {
    const parseData = [
      cycle,
      user.account,
      user.claimIds,
      user.claimTimestamps,
      user.claimAmounts,
    ];
    dataList.push(parseData);
  }
  // console.log('dataList ', dataList);
  const tree = StandardMerkleTree.of(dataList, [
    "uint256",
    "address",
    "string[]",
    "uint256[]",
    "uint256[]",
  ]);
  const userClaimsWithProof = treeElements.reduce(
    (memo, { account }, index) => {
      // @ts-ignore
      const claimIds = mappedClaim[account].claimIds;
      // @ts-ignore
      const claimTimestamps = mappedClaim[account].claimTimestamps;
      // @ts-ignore
      const claimAmounts = mappedClaim[account].claimAmounts;

      // @ts-ignore
      memo[account] = {
        cycle,
        claimIds,
        claimTimestamps,
        claimAmounts,
        proof: tree.getProof(index),
      };
      return memo;
    },
    {}
  );
  const result = {
    cycle: cycle,
    merkleRoot: tree.root,
    userClaims: userClaimsWithProof,
  };

  // console.log('result: ', result);

  return result;
};

const addAccountInMapping = async (mappedTokensAmounts: any) => {
  const cycle = 0;
  return Object.keys(mappedTokensAmounts).map((account) => ({
    cycle,
    account,
    claimIds: mappedTokensAmounts[account].claimIds,
    claimTimestamps: mappedTokensAmounts[account].claimTimestamps,
    claimAmounts: mappedTokensAmounts[account].claimAmounts,
  }));
};
