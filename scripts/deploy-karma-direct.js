// Direct deployment script for FaithToken (777,777,000 supply) without using Hardhat runtime
const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

// Load contract artifacts
const contractJson = require('../artifacts/contracts/FaithToken.sol/FaithToken.json');

async function main() {
  // Check for private key
  if (!process.env.PRIVATE_KEY) {
    console.error("Missing PRIVATE_KEY in .env file");
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
  console.log(`Deploying with account: ${wallet.address}`);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`Account balance: ${ethers.utils.formatEther(balance)} STT`);
  
  if (balance.isZero()) {
    console.error("Account has no balance for gas fees");
    process.exit(1);
  }
  
  // Deploy contract
  console.log("Deploying Faith Token contract...");
  console.log("(Supply: 777,777,000 FAITH, 1,000 tokens per prayer action)");
  
  const factory = new ethers.ContractFactory(
    contractJson.abi, 
    contractJson.bytecode,
    wallet
  );
  
  try {
    const contract = await factory.deploy();
    console.log(`Transaction hash: ${contract.deployTransaction.hash}`);
    console.log("Waiting for deployment confirmation...");
    
    await contract.deployed();
    const contractAddress = contract.address;
    
    console.log(`\nFaith Token deployed to: ${contractAddress}`);
    
    // Update .env file with the contract address
    const envFile = fs.readFileSync('.env', 'utf8');
    const updatedEnv = envFile.replace(
      /CONTRACT_ADDRESS=.*/,
      `CONTRACT_ADDRESS=${contractAddress}`
    );
    
    fs.writeFileSync('.env', updatedEnv);
    console.log("Updated CONTRACT_ADDRESS in .env file");
    
    // Output contract verification command
    console.log("\nVerify contract with:");
    console.log(`npx hardhat verify --network somnia-testnet ${contractAddress}`);
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 