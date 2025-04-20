// Deploy script for GoldToken contract
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Gold Token contract...");

  // Get the contract factory
  const GoldToken = await ethers.getContractFactory("GoldToken");
  
  // Deploy the contract
  const goldToken = await GoldToken.deploy();

  // Wait for deployment to finish
  await goldToken.deployed();

  console.log(`Gold Token deployed to: ${goldToken.address}`);
  
  // Get contract info
  const totalSupply = await goldToken.MAX_SUPPLY();
  const name = await goldToken.name();
  const symbol = await goldToken.symbol();
  
  console.log(`Token Name: ${name}`);
  console.log(`Token Symbol: ${symbol}`);
  console.log(`Total Supply: ${ethers.utils.formatEther(totalSupply)} GOLD`);
  console.log(`Tokens Per Mine: ${ethers.utils.formatEther(await goldToken.TOKENS_PER_MINE())} GOLD`);
  
  console.log("\nVerify contract with:");
  console.log(`npx hardhat verify --network somnia-testnet ${goldToken.address}`);
  
  // Encourage updating ENV file
  console.log("\nDon't forget to update your .env file with the contract address!");
  console.log(`CONTRACT_ADDRESS=${goldToken.address}`);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });