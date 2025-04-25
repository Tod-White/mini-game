require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    somnia: {
      url: "https://dream-rpc.somnia.network",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 50312
    }
  },
  etherscan: {
    apiKey: {
      somnia: process.env.EXPLORER_API_KEY || ''
    },
    customChains: [
      {
        network: "somnia",
        chainId: 50312,
        urls: {
          apiURL: "https://somnia-testnet.socialscan.io/api",
          browserURL: "https://somnia-testnet.socialscan.io"
        }
      }
    ]
  }
};