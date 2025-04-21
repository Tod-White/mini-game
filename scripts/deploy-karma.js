// Deploy script for KarmaToken contract
const hre = require("hardhat");

async function main() {
  console.log("Deploying Karma Token contract...");

  // Get the contract factory
  const KarmaToken = await hre.ethers.getContractFactory("KarmaToken");
  
  // Deploy the contract
  const karmaToken = await KarmaToken.deploy();

  // Wait for deployment to finish
  await karmaToken.waitForDeployment();

  const karmaTokenAddress = await karmaToken.getAddress();
  console.log(`Karma Token deployed to: ${karmaTokenAddress}`);
  
  // Get contract info
  const totalSupply = await karmaToken.MAX_SUPPLY();
  const name = await karmaToken.name();
  const symbol = await karmaToken.symbol();
  const tokensPerMine = await karmaToken.TOKENS_PER_MINE();
  
  console.log(`Token Name: ${name}`);
  console.log(`Token Symbol: ${symbol}`);
  console.log(`Total Supply: ${hre.ethers.formatEther(totalSupply)} KARMA`);
  console.log(`Tokens Per Mine: ${hre.ethers.formatEther(tokensPerMine)} KARMA (10K per mining action)`);
  
  console.log("\nVerify contract with:");
  console.log(`npx hardhat verify --network somnia-testnet ${karmaTokenAddress}`);
  
  // Encourage updating ENV file
  console.log("\nDon't forget to update your .env file with the contract address!");
  console.log(`CONTRACT_ADDRESS=${karmaTokenAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 