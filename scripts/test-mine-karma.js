// Test script to mine Karma tokens
const hre = require("hardhat");

async function main() {
  // Get contract address from environment
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  console.log(`Using contract at: ${contractAddress}`);
  
  // Get the contract factory and attach to deployed contract
  const KarmaToken = await hre.ethers.getContractFactory("KarmaToken");
  const karmaToken = await KarmaToken.attach(contractAddress);
  
  // Get initial balances and stats
  const [signer] = await hre.ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  const initialBalance = await karmaToken.balanceOf(signer.address);
  const initialMinerStats = await karmaToken.minerStats(signer.address);
  const initialTotalMined = await karmaToken.totalMined();
  
  console.log(`\nInitial balance: ${hre.ethers.formatEther(initialBalance)} KARMA`);
  console.log(`Initial miner stats: ${hre.ethers.formatEther(initialMinerStats)} KARMA`);
  console.log(`Initial total mined: ${hre.ethers.formatEther(initialTotalMined)} KARMA`);
  
  // Mine tokens
  console.log("\nMining tokens... (10K KARMA per mining action)");
  
  const tx = await karmaToken.mine();
  await tx.wait();
  
  console.log(`Transaction hash: ${tx.hash}`);
  
  // Get updated balances and stats
  const newBalance = await karmaToken.balanceOf(signer.address);
  const newMinerStats = await karmaToken.minerStats(signer.address);
  const newTotalMined = await karmaToken.totalMined();
  
  // Calculate differences
  const balanceDiff = newBalance.sub(initialBalance);
  const statsDiff = newMinerStats.sub(initialMinerStats);
  const minedDiff = newTotalMined.sub(initialTotalMined);
  
  console.log(`\nNew balance: ${hre.ethers.formatEther(newBalance)} KARMA`);
  console.log(`Balance change: ${hre.ethers.formatEther(balanceDiff)} KARMA`);
  
  console.log(`\nNew miner stats: ${hre.ethers.formatEther(newMinerStats)} KARMA`);
  console.log(`Miner stats change: ${hre.ethers.formatEther(statsDiff)} KARMA`);
  
  console.log(`\nNew total mined: ${hre.ethers.formatEther(newTotalMined)} KARMA`);
  console.log(`Total mined change: ${hre.ethers.formatEther(minedDiff)} KARMA`);
  
  // Get remaining supply
  const remainingSupply = await karmaToken.getRemainingSupply();
  console.log(`\nRemaining supply: ${hre.ethers.formatEther(remainingSupply)} KARMA`);
  
  // Calculate mining progress
  const miningProgress = (parseFloat(hre.ethers.formatEther(newTotalMined)) / 
                         parseFloat(hre.ethers.formatEther(await karmaToken.MAX_SUPPLY()))) * 100;
  console.log(`Mining progress: ${miningProgress.toFixed(4)}%`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 