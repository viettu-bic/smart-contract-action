import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import env from "./env";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.23',
        settings: {
          optimizer: { enabled: true, runs: 1000000 }
        }
      },
    ]
  },
  networks: {
    arbitrum: {
      url: "https://arbitrum.llamarpc.com",
      chainId: 42161,
      accounts: [env.PRIVATE_KEY as string],
    },
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: [env.PRIVATE_KEY as string],
    },
  },
  etherscan: {
    apiKey: env.API_KEY,
  }
};

export default config;
