// Deploy script for FaithToken contract
const hre = require("hardhat");

async function main() {
  console.log("Deploying Faith Token contract...");

  // Get the contract factory
  const FaithToken = await hre.ethers.getContractFactory("FaithToken");
  
  // Deploy the contract
  const faithToken = await FaithToken.deploy();

  // Wait for deployment to finish
  await faithToken.waitForDeployment();

  const faithTokenAddress = await faithToken.getAddress();
  console.log(`Faith Token deployed to: ${faithTokenAddress}`);
  
  // Get contract info
  const totalSupply = await faithToken.MAX_SUPPLY();
  const name = await faithToken.name();
  const symbol = await faithToken.symbol();
  const tokensPerMine = await faithToken.TOKENS_PER_MINE();
  
  console.log(`Token Name: ${name}`);
  console.log(`Token Symbol: ${symbol}`);
  console.log(`Total Supply: ${hre.ethers.formatEther(totalSupply)} FAITH`);
  console.log(`Tokens Per Mine: ${hre.ethers.formatEther(tokensPerMine)} FAITH (1,000 per mining action)`);
  
  console.log("\nVerify contract with:");
  console.log(`npx hardhat verify --network somnia-testnet ${faithTokenAddress}`);
  
  // Encourage updating ENV file
  console.log("\nDon't forget to update your .env file with the contract address!");
  console.log(`CONTRACT_ADDRESS=${faithTokenAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 