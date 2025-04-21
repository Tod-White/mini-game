// Test script to mine Karma tokens directly (without Hardhat runtime)
const { ethers } = require('ethers');
require('dotenv').config();

// Load contract artifacts
const contractJson = require("../artifacts/contracts/KarmaToken.sol/KarmaToken.json");

async function main() {
  // Get contract address from environment
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  // Provider setup
  const rpcUrls = (process.env.RPC_URL || "https://dream-rpc.somnia.network").split(',');
  console.log(`Trying ${rpcUrls.length} RPC endpoints...`);
  
  let provider;
  let connected = false;
  
  // Try each RPC URL until one works
  for (const url of rpcUrls) {
    try {
      provider = new ethers.providers.JsonRpcProvider(url.trim());
      // Test the connection
      await provider.getNetwork();
      console.log(`Connected to RPC: ${url.trim()}`);
      connected = true;
      break;
    } catch (error) {
      console.log(`Failed to connect to RPC: ${url.trim()}`);
    }
  }
  
  if (!connected) {
    console.error("Could not connect to any RPC endpoint. Please check your network connection and RPC URLs.");
    process.exit(1);
  }
  
  // Wallet setup
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`Using account: ${wallet.address}`);
  
  // Contract instance
  const karmaToken = new ethers.Contract(contractAddress, contractJson.abi, wallet);
  
  // Get initial balances and stats
  const initialBalance = await karmaToken.balanceOf(wallet.address);
  const initialMinerStats = await karmaToken.minerStats(wallet.address);
  const initialTotalMined = await karmaToken.totalMined();
  
  console.log(`\nInitial balance: ${ethers.utils.formatEther(initialBalance)} KARMA`);
  console.log(`Initial miner stats: ${ethers.utils.formatEther(initialMinerStats)} KARMA`);
  console.log(`Initial total mined: ${ethers.utils.formatEther(initialTotalMined)} KARMA`);
  
  // Mine tokens
  console.log("\nMining tokens... (10K KARMA per mining action)");
  
  try {
    const tx = await karmaToken.mine();
    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Waiting for transaction confirmation...");
    
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Get updated balances and stats
    const newBalance = await karmaToken.balanceOf(wallet.address);
    const newMinerStats = await karmaToken.minerStats(wallet.address);
    const newTotalMined = await karmaToken.totalMined();
    
    // Calculate differences
    const balanceDiff = newBalance.sub(initialBalance);
    const statsDiff = newMinerStats.sub(initialMinerStats);
    const minedDiff = newTotalMined.sub(initialTotalMined);
    
    console.log(`\nNew balance: ${ethers.utils.formatEther(newBalance)} KARMA`);
    console.log(`Balance change: ${ethers.utils.formatEther(balanceDiff)} KARMA`);
    
    console.log(`\nNew miner stats: ${ethers.utils.formatEther(newMinerStats)} KARMA`);
    console.log(`Miner stats change: ${ethers.utils.formatEther(statsDiff)} KARMA`);
    
    console.log(`\nNew total mined: ${ethers.utils.formatEther(newTotalMined)} KARMA`);
    console.log(`Total mined change: ${ethers.utils.formatEther(minedDiff)} KARMA`);
    
    // Get remaining supply
    const remainingSupply = await karmaToken.getRemainingSupply();
    console.log(`\nRemaining supply: ${ethers.utils.formatEther(remainingSupply)} KARMA`);
    
    // Calculate mining progress
    const miningProgress = (parseFloat(ethers.utils.formatEther(newTotalMined)) / 
                          parseFloat(ethers.utils.formatEther(await karmaToken.MAX_SUPPLY()))) * 100;
    console.log(`Mining progress: ${miningProgress.toFixed(4)}%`);
    
  } catch (error) {
    console.error("Error mining tokens:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 