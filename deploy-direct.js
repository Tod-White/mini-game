// Direct deployment script without using Hardhat runtime
const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

// Load contract artifacts
const contractJson = require('./artifacts/contracts/GoldToken.sol/GoldToken.json');

async function main() {
  // Check for private key
  if (!process.env.PRIVATE_KEY) {
    console.error("Missing PRIVATE_KEY in .env file");
    process.exit(1);
  }

  // Provider setup
  const rpcUrl = process.env.RPC_URL || "https://dream-rpc.somnia.network";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Wallet setup
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`Deploying with account: ${wallet.address}`);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} STT`);
  
  if (balance === 0n) {
    console.error("Account has no balance for gas fees");
    process.exit(1);
  }
  
  // Deploy contract
  console.log("Deploying Gold Token contract...");
  
  const factory = new ethers.ContractFactory(
    contractJson.abi, 
    contractJson.bytecode,
    wallet
  );
  
  try {
    const contract = await factory.deploy();
    console.log(`Transaction hash: ${contract.deploymentTransaction().hash}`);
    console.log("Waiting for deployment confirmation...");
    
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log(`\nGold Token deployed to: ${contractAddress}`);
    
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
