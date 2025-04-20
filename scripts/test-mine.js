// Script to test mining functionality of the deployed GoldToken
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // Get contract address from environment
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // Get contract instance
  const GoldToken = await ethers.getContractFactory("GoldToken");
  const goldToken = await GoldToken.attach(contractAddress);
  
  // Get initial balances and stats
  const initialBalance = await goldToken.balanceOf(signer.address);
  const initialMinerStats = await goldToken.minerStats(signer.address);
  const initialTotalMined = await goldToken.totalMined();
  
  console.log(`\nInitial balance: ${ethers.utils.formatEther(initialBalance)} GOLD`);
  console.log(`Initial miner stats: ${ethers.utils.formatEther(initialMinerStats)} GOLD`);
  console.log(`Initial total mined: ${ethers.utils.formatEther(initialTotalMined)} GOLD`);
  
  // Mine tokens
  console.log("\nMining tokens...");
  const tx = await goldToken.mine();
  console.log(`Transaction hash: ${tx.hash}`);
  
  await tx.wait();
  console.log("Mining transaction confirmed!");
  
  // Get updated balances and stats
  const newBalance = await goldToken.balanceOf(signer.address);
  const newMinerStats = await goldToken.minerStats(signer.address);
  const newTotalMined = await goldToken.totalMined();
  
  console.log(`\nNew balance: ${ethers.utils.formatEther(newBalance)} GOLD`);
  console.log(`New miner stats: ${ethers.utils.formatEther(newMinerStats)} GOLD`);
  console.log(`New total mined: ${ethers.utils.formatEther(newTotalMined)} GOLD`);
  
  // Calculate differences
  const balanceDiff = newBalance.sub(initialBalance);
  const minedDiff = newTotalMined.sub(initialTotalMined);
  
  console.log(`\nReceived: ${ethers.utils.formatEther(balanceDiff)} GOLD`);
  console.log(`Total mined change: ${ethers.utils.formatEther(minedDiff)} GOLD`);
  
  // Get remaining supply
  const remainingSupply = await goldToken.getRemainingSupply();
  console.log(`\nRemaining supply: ${ethers.utils.formatEther(remainingSupply)} GOLD`);
  
  // Calculate mining progress
  const miningProgress = (parseFloat(ethers.utils.formatEther(newTotalMined)) / 
                         parseFloat(ethers.utils.formatEther(await goldToken.MAX_SUPPLY()))) * 100;
  console.log(`Mining progress: ${miningProgress.toFixed(4)}%`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });