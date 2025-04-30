// Create a new file to check tokens
const { ethers } = require('ethers');

async function checkDeployedTokens() {
  try {
    console.log("Starting token check...");
    
    // Factory ABI (minimal for this check)
    const factoryABI = [
      "function getDeployedTokenCount() view returns (uint256)",
      "function getTokenByIndex(uint256 index) view returns (tuple(string name, string symbol, address tokenAddress, address creator, uint256 totalSupply, uint256 timestamp))"
    ];
    
    // Factory address
    const FACTORY_ADDRESS = '0x178465595D9fDc350D28DEf432ad8684F1de48A5';
    
    console.log("Setting up provider...");
    // Provider setup
    const provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network');
    
    console.log("Creating contract instance...");
    // Create contract instance
    const factoryContract = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
    
    console.log("Calling getDeployedTokenCount...");
    // Get token count
    const count = await factoryContract.getDeployedTokenCount();
    console.log('Number of deployed tokens:', Number(count));
    
    // If tokens exist, display them
    if (Number(count) > 0) {
      console.log('Tokens:');
      for (let i = 0; i < Number(count); i++) {
        const token = await factoryContract.getTokenByIndex(i);
        console.log(`Token ${i+1}:`);
        console.log(`  Name: ${token.name}`);
        console.log(`  Symbol: ${token.symbol}`);
        console.log(`  Address: ${token.tokenAddress}`);
        console.log(`  Creator: ${token.creator}`);
        console.log(`  Total Supply: ${ethers.formatUnits(token.totalSupply, 18)}`);
        console.log(`  Timestamp: ${new Date(Number(token.timestamp) * 1000).toLocaleString()}`);
        console.log('---');
      }
    }
  } catch (error) {
    console.error('Error checking tokens:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

// Run the function
checkDeployedTokens(); 