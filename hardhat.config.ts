import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.VERIFIABLE_INTAKE_PRIVATE_KEY 
        ? [process.env.VERIFIABLE_INTAKE_PRIVATE_KEY]
        : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo",
      accounts: process.env.VERIFIABLE_INTAKE_PRIVATE_KEY 
        ? [process.env.VERIFIABLE_INTAKE_PRIVATE_KEY]
        : [],
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: process.env.VERIFIABLE_INTAKE_PRIVATE_KEY 
        ? [process.env.VERIFIABLE_INTAKE_PRIVATE_KEY]
        : [],
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.VERIFIABLE_INTAKE_PRIVATE_KEY 
        ? [process.env.VERIFIABLE_INTAKE_PRIVATE_KEY]
        : [],
    },
  } as any,
  etherscan: {
    // Obtain API keys from:
    // Etherscan: https://etherscan.io/myapikey
    // Polygonscan: https://polygonscan.com/myapikey
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
  paths: {
    sources: "./src/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
