// Deploy script for GoldToken contract

async function main() {
  console.log("Deploying Gold Token contract...");

  // Get the contract factory
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const GoldToken = await ethers.getContractFactory("GoldToken");
  
  // Deploy the contract
  const goldToken = await GoldToken.deploy();

  // Wait for deployment to finish
  await goldToken.waitForDeployment();
  
  const goldTokenAddress = await goldToken.getAddress();
  console.log(`Gold Token deployed to: ${goldTokenAddress}`);
  
  // Get contract info
  const totalSupply = await goldToken.MAX_SUPPLY();
  const name = await goldToken.name();
  const symbol = await goldToken.symbol();
  
  console.log(`Token Name: ${name}`);
  console.log(`Token Symbol: ${symbol}`);
  console.log(`Total Supply: ${ethers.formatEther(totalSupply)} GOLD`);
  console.log(`Tokens Per Mine: ${ethers.formatEther(await goldToken.TOKENS_PER_MINE())} GOLD`);
  
  console.log("\nVerify contract with:");
  console.log(`npx hardhat verify --network somnia-testnet ${goldTokenAddress}`);
  
  // Encourage updating ENV file
  console.log("\nDon't forget to update your .env file with the contract address!");
  console.log(`CONTRACT_ADDRESS=${goldTokenAddress}`);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });