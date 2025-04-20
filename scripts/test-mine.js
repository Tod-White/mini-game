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
  
  console.log(`\nInitial balance: ${ethers.formatEther(initialBalance)} GOLD`);
  console.log(`Initial miner stats: ${ethers.formatEther(initialMinerStats)} GOLD`);
  console.log(`Initial total mined: ${ethers.formatEther(initialTotalMined)} GOLD`);
  
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
  
  console.log(`\nNew balance: ${ethers.formatEther(newBalance)} GOLD`);
  console.log(`New miner stats: ${ethers.formatEther(newMinerStats)} GOLD`);
  console.log(`New total mined: ${ethers.formatEther(newTotalMined)} GOLD`);
  
  // Calculate differences
  const balanceDiff = newBalance - initialBalance;
  const minedDiff = newTotalMined - initialTotalMined;
  
  console.log(`\nReceived: ${ethers.formatEther(balanceDiff)} GOLD`);
  console.log(`Total mined change: ${ethers.formatEther(minedDiff)} GOLD`);
  
  // Get remaining supply
  const remainingSupply = await goldToken.getRemainingSupply();
  console.log(`\nRemaining supply: ${ethers.formatEther(remainingSupply)} GOLD`);
  
  // Calculate mining progress
  const maxSupply = await goldToken.MAX_SUPPLY();
  const miningProgress = (Number(ethers.formatEther(newTotalMined)) / 
                         Number(ethers.formatEther(maxSupply))) * 100;
  console.log(`Mining progress: ${miningProgress.toFixed(4)}%`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });