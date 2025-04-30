const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // The factory contract address on Somnia testnet
  const FACTORY_ADDRESS = "0x178465595D9fDc350D28DEf432ad8684F1de48A5";
  
  // Get the provider
  const provider = ethers.provider;
  
  // Get the factory contract
  const factoryABI = [
    "function requiredBurnAmount() external view returns (uint256)",
    "function owner() external view returns (address)",
    "function faithToken() external view returns (address)"
  ];
  
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
  
  // Get current burn amount
  const currentBurnAmount = await factory.requiredBurnAmount();
  console.log(`Current burn amount: ${ethers.formatEther(currentBurnAmount)} FAITH`);
  
  // Get owner
  const owner = await factory.owner();
  console.log(`Contract owner: ${owner}`);
  
  // Get FAITH token address
  const faithTokenAddress = await factory.faithToken();
  console.log(`FAITH token address: ${faithTokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 