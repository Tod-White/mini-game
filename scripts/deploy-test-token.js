// Script to deploy a test token using the factory
const { ethers } = require("hardhat");

async function main() {
  // Get the factory address
  const factoryAddress = process.env.FACTORY_ADDRESS;
  const faithTokenAddress = process.env.FAITH_TOKEN_ADDRESS;
  
  if (!factoryAddress) {
    console.error("FACTORY_ADDRESS not set in environment variables");
    process.exit(1);
  }
  
  if (!faithTokenAddress) {
    console.error("FAITH_TOKEN_ADDRESS not set in environment variables");
    process.exit(1);
  }
  
  console.log("Using factory at:", factoryAddress);
  console.log("Using FAITH token at:", faithTokenAddress);

  // Get contract instances
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const factory = await ethers.getContractAt("PrayerTokenFactory", factoryAddress);
  const faithToken = await ethers.getContractAt("FaithToken", faithTokenAddress);
  
  // Check required burn amount
  const burnAmount = await factory.requiredBurnAmount();
  console.log("Required burn amount:", ethers.formatEther(burnAmount), "FAITH");
  
  // Check FAITH balance
  const balance = await faithToken.balanceOf(deployer.address);
  console.log("Your FAITH balance:", ethers.formatEther(balance));
  
  if (balance < burnAmount) {
    console.error("Insufficient FAITH tokens. You need at least", ethers.formatEther(burnAmount), "FAITH tokens.");
    process.exit(1);
  }
  
  // Check allowance
  const allowance = await faithToken.allowance(deployer.address, factoryAddress);
  console.log("Current allowance:", ethers.formatEther(allowance), "FAITH");
  
  if (allowance < burnAmount) {
    console.log("Approving FAITH tokens for burning...");
    const approveTx = await faithToken.approve(factoryAddress, burnAmount);
    await approveTx.wait();
    console.log("Approved FAITH tokens for burning.");
  }
  
  // Deploy token
  console.log("Deploying new prayer token...");
  const tokenName = "Test Prayer Token";
  const tokenSymbol = "TPT";
  const totalSupply = 1000000; // 1 million tokens
  
  const tx = await factory.createToken(tokenName, tokenSymbol, totalSupply);
  const receipt = await tx.wait();
  
  // Get deployed token address from event
  const event = receipt.logs.find(log => 
    log.topics[0] === ethers.id("TokenDeployed(address,string,string,address,uint256,uint256)")
  );
  
  const tokenAddress = "0x" + event.topics[1].slice(26); // Extract the address from the first indexed parameter
  
  console.log("Deployed token address:", tokenAddress);
  console.log("Token name:", tokenName);
  console.log("Token symbol:", tokenSymbol);
  console.log("Total supply:", totalSupply, "tokens");
  
  const prayerToken = await ethers.getContractAt("PrayerToken", tokenAddress);
  console.log("Max supply:", ethers.formatEther(await prayerToken.MAX_SUPPLY()), "tokens");
  
  console.log("\nTest mining the token...");
  const mineTx = await prayerToken.mine();
  await mineTx.wait();
  
  const mined = await prayerToken.totalMined();
  console.log("Successfully mined tokens. Total mined:", ethers.formatEther(mined));
  console.log("Your token balance:", ethers.formatEther(await prayerToken.balanceOf(deployer.address)));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 