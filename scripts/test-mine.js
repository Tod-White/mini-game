// Script to test mining functionality of the deployed GoldToken
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // Get contract address from environment
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // Get contract instance
  const GoldToken = await hre.ethers.getContractFactory("GoldToken");
  const goldToken = await GoldToken.attach(contractAddress);
  
  // Get initial balances and stats
  const initialBalance = await goldToken.balanceOf(signer.address);
  const initialMinerStats = await goldToken.minerStats(signer.address);
  const initialTotalMined = await goldToken.totalMined();
  
  console.log(`\nInitial balance: ${hre.ethers.utils.formatEther(initialBalance)} GOLD`);
  console.log(`Initial miner stats: ${hre.ethers.utils.formatEther(initialMinerStats)} GOLD`);
  console.log(`Initial total mined: ${hre.ethers.utils.formatEther(initialTotalMined)} GOLD`);
  
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
  
  console.log(`\nNew balance: ${hre.ethers.utils.formatEther(newBalance)} GOLD`);
  console.log(`New miner stats: ${hre.ethers.utils.formatEther(newMinerStats)} GOLD`);
  console.log(`New total mined: ${hre.ethers.utils.formatEther(newTotalMined)} GOLD`);
  
  // Calculate differences
  const balanceDiff = newBalance.sub(initialBalance);
  const minedDiff = newTotalMined.sub(initialTotalMined);
  
  console.log(`\nReceived: ${hre.ethers.utils.formatEther(balanceDiff)} GOLD`);
  console.log(`Total mined change: ${hre.ethers.utils.formatEther(minedDiff)} GOLD`);
  
  // Get remaining supply
  const remainingSupply = await goldToken.getRemainingSupply();
  console.log(`\nRemaining supply: ${hre.ethers.utils.formatEther(remainingSupply)} GOLD`);
  
  // Calculate mining progress
  const miningProgress = (parseFloat(hre.ethers.utils.formatEther(newTotalMined)) / 
                         parseFloat(hre.ethers.utils.formatEther(await goldToken.MAX_SUPPLY()))) * 100;
  console.log(`Mining progress: ${miningProgress.toFixed(4)}%`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });