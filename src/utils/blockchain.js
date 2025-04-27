const { ethers } = require('ethers');

// Contract ABI - FaithToken
const FaithTokenABI = [
  // Read-only functions
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  
  // Mining functions
  "function mine() external",
  "function getMinerStats(address miner) external view returns (uint256)",
  "function getRemainingSupply() external view returns (uint256)",
  "function totalMined() external view returns (uint256)",
  "function TOKENS_PER_MINE() external view returns (uint256)",
  "function MAX_SUPPLY() external view returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Mining(address indexed miner, uint256 amount, uint256 timestamp)",
  "event MiningExhausted(uint256 totalMined, uint256 timestamp)"
];

// Constants
export const SOMNIA_CHAIN_ID = 50312;
export const CONTRACT_ADDRESS = '0x3E9c46064B5f8Ab4605506841076059F3e93fbb0';
export const SOMNIA_RPC_URL = 'https://dream-rpc.somnia.network';
export const EXPLORER_URL = 'https://shannon-explorer.somnia.network';

// Transaction status constants
export const TX_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed'
};

// Network configuration for MetaMask
export const SOMNIA_NETWORK_PARAMS = {
  chainId: `0x${SOMNIA_CHAIN_ID.toString(16)}`,
  chainName: 'Somnia Testnet',
  nativeCurrency: {
    name: 'Somnia Token',
    symbol: 'STT',
    decimals: 18
  },
  rpcUrls: [SOMNIA_RPC_URL, 'https://rpc.ankr.com/somnia_testnet'],
  blockExplorerUrls: [EXPLORER_URL]
};

// Provider and contract setup
let provider;
let signer;
let faithTokenContract;
let networkSwitchListeners = [];

// Transaction listeners
const transactionListeners = {};

// Event listeners
const eventListeners = {
  mining: [],
  transfer: [],
  exhausted: []
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && window.ethereum !== undefined;
};

// Initialize the blockchain connection
export const initBlockchain = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }
  
  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Set up provider and signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = await provider.getSigner();
    
    // Get current network
    const network = await provider.getNetwork();
    const isCorrectNetwork = Number(network.chainId) === Number(SOMNIA_CHAIN_ID);
    console.log("[blockchain.js] Wallet chainId:", network.chainId, "Expected:", SOMNIA_CHAIN_ID, "Correct:", isCorrectNetwork);
    
    // Notify listeners about the current network status
    networkSwitchListeners.forEach(callback => {
      callback(isCorrectNetwork);
    });
    
    // Check if we're on Somnia
    if (!isCorrectNetwork) {
      console.log("Not on Somnia network, need to switch...");
      return { 
        account: accounts[0], 
        isCorrectNetwork: false,
        network: network
      };
    }
    
    // Initialize contract connection
    faithTokenContract = new ethers.Contract(CONTRACT_ADDRESS, FaithTokenABI, signer);
    
    // Set up event listeners
    setupEventListeners();
    
    return { 
      account: accounts[0], 
      isCorrectNetwork: true,
      network: network
    };
  } catch (error) {
    console.error("Blockchain initialization error:", error);
    throw error;
  }
};

// Set up event listeners
const setupEventListeners = () => {
  if (!faithTokenContract) return;
  
  // Mining event
  faithTokenContract.on("Mining", (miner, amount, timestamp) => {
    const event = {
      miner,
      amount: ethers.utils.formatUnits(amount, 18),
      timestamp: timestamp.toNumber(),
      date: new Date(timestamp.toNumber() * 1000)
    };
    
    console.log("Prayer event:", event);
    
    // Notify all listeners
    eventListeners.mining.forEach(callback => callback(event));
  });
  
  // Transfer event
  faithTokenContract.on("Transfer", (from, to, value) => {
    const event = {
      from,
      to,
      value: ethers.utils.formatUnits(value, 18)
    };
    
    console.log("Transfer event:", event);
    
    // Notify all listeners
    eventListeners.transfer.forEach(callback => callback(event));
  });
  
  // MiningExhausted event
  faithTokenContract.on("MiningExhausted", (totalMined, timestamp) => {
    const event = {
      totalMined: ethers.utils.formatUnits(totalMined, 18),
      timestamp: timestamp.toNumber(),
      date: new Date(timestamp.toNumber() * 1000)
    };
    
    console.log("Prayer exhausted event:", event);
    
    // Notify all listeners
    eventListeners.exhausted.forEach(callback => callback(event));
  });
};

// Subscribe to event
export const subscribeToEvent = (eventName, callback) => {
  if (!eventListeners[eventName]) {
    console.error(`Event ${eventName} not supported`);
    return;
  }
  
  eventListeners[eventName].push(callback);
  
  // Initialize event listeners if not already done
  if (faithTokenContract && eventListeners[eventName].length === 1) {
    setupEventListeners();
  }
};

// Unsubscribe from event
export const unsubscribeFromEvent = (eventName, callback) => {
  if (!eventListeners[eventName]) return;
  
  const index = eventListeners[eventName].indexOf(callback);
  if (index !== -1) {
    eventListeners[eventName].splice(index, 1);
  }
};

// Add network switch listener
export const addNetworkSwitchListener = (listener) => {
  networkSwitchListeners.push(listener);
  
  // Set up event listener for network changes
  if (window.ethereum && networkSwitchListeners.length === 1) {
    // Initial check
    setTimeout(async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        const isCorrectNetwork = Number(network.chainId) === Number(SOMNIA_CHAIN_ID);
        console.log("[blockchain.js] Wallet chainId:", network.chainId, "Expected:", SOMNIA_CHAIN_ID, "Correct:", isCorrectNetwork);
        
        networkSwitchListeners.forEach(callback => {
          callback(isCorrectNetwork);
        });
      } catch (error) {
        console.error("Error in initial network check:", error);
      }
    }, 100);
    
    // Listen for chain changes
    window.ethereum.on('chainChanged', (chainIdHex) => {
      try {
        const chainId = parseInt(chainIdHex, 16);
        const isCorrectNetwork = Number(chainId) === Number(SOMNIA_CHAIN_ID);
        console.log("[blockchain.js] Chain changed to:", chainId, "Expected:", SOMNIA_CHAIN_ID, "Correct:", isCorrectNetwork);
        
        console.log(`Chain changed to: ${chainId}, correct network: ${isCorrectNetwork}`);
        
        networkSwitchListeners.forEach(callback => {
          callback(isCorrectNetwork);
        });
      } catch (error) {
        console.error("Error handling chain change:", error);
      }
    });
    
    // Also listen for errors that might indicate wrong network
    window.ethereum.on('error', (error) => {
      console.error('Ethereum provider error:', error);
      // Notify listeners about network error
      networkSwitchListeners.forEach(callback => {
        callback(false);
      });
    });
  }
};

// Add Somnia network to MetaMask
export const addSomniaNetwork = async () => {
  if (!window.ethereum) throw new Error("MetaMask is not installed");
  
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [SOMNIA_NETWORK_PARAMS]
    });
    
    return true;
  } catch (error) {
    console.error("Error adding Somnia network:", error);
    throw error;
  }
};

// Switch to Somnia network in MetaMask
export const switchToSomniaNetwork = async () => {
  if (!window.ethereum) throw new Error("MetaMask is not installed");
  
  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SOMNIA_NETWORK_PARAMS.chainId }]
    });
    
    // Explicitly notify listeners about the network change
    setTimeout(() => {
      networkSwitchListeners.forEach(callback => {
        callback(true); // We just switched to Somnia, so this should be true
      });
    }, 500);
    
    return true;
  } catch (error) {
    // If the network doesn't exist, add it
    if (error.code === 4902) {
      try {
        await addSomniaNetwork();
        
        // Explicitly notify listeners about the network change
        setTimeout(() => {
          networkSwitchListeners.forEach(callback => {
            callback(true); // We just added Somnia, so this should be true
          });
        }, 500);
        
        return true;
      } catch (addError) {
        console.error("Error adding Somnia network:", addError);
        throw addError;
      }
    }
    throw error;
  }
};

// Get balance
export const getBalance = async (address) => {
  if (!faithTokenContract) throw new Error("Contract not initialized");
  
  const balance = await faithTokenContract.balanceOf(address);
  return ethers.utils.formatUnits(balance, 18);
};

// Get miner stats
export const getMinerStats = async (address) => {
  if (!faithTokenContract) throw new Error("Contract not initialized");
  
  const stats = await faithTokenContract.getMinerStats(address);
  return ethers.utils.formatUnits(stats, 18);
};

// Get global statistics
export const getGlobalStats = async () => {
  // Initialize a read-only provider for non-authenticated users
  const readOnlyProvider = new ethers.providers.JsonRpcProvider(SOMNIA_RPC_URL);
  
  if (!faithTokenContract) {
    console.log("Using read-only contract for global stats");
    const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, FaithTokenABI, readOnlyProvider);
    
    try {
      // Get statistics from the contract
      const totalMined = await readOnlyContract.totalMined();
      const remainingSupply = await readOnlyContract.getRemainingSupply();
      const totalSupply = await readOnlyContract.MAX_SUPPLY();
      console.log("[getGlobalStats] totalMined:", totalMined.toString());
      console.log("[getGlobalStats] remainingSupply:", remainingSupply.toString());
      console.log("[getGlobalStats] totalSupply:", totalSupply.toString());
      return {
        totalMined: parseFloat(ethers.utils.formatUnits(totalMined, 18)),
        remainingSupply: parseFloat(ethers.utils.formatUnits(remainingSupply, 18)),
        totalSupply: parseFloat(ethers.utils.formatUnits(totalSupply, 18))
      };
    } catch (error) {
      console.error("[getGlobalStats] Error fetching global stats (readOnlyContract):", error);
      // Return default values if there's an error
      return {
        totalMined: 0,
        remainingSupply: 777777000,
        totalSupply: 777777000
      };
    }
  }
  
  try {
    // Get statistics from the contract
    const totalMined = await faithTokenContract.totalMined();
    const remainingSupply = await faithTokenContract.getRemainingSupply();
    const totalSupply = await faithTokenContract.MAX_SUPPLY();
    console.log("[getGlobalStats] totalMined (connected):", totalMined.toString());
    console.log("[getGlobalStats] remainingSupply (connected):", remainingSupply.toString());
    console.log("[getGlobalStats] totalSupply (connected):", totalSupply.toString());
    return {
      totalMined: parseFloat(ethers.utils.formatUnits(totalMined, 18)),
      remainingSupply: parseFloat(ethers.utils.formatUnits(remainingSupply, 18)),
      totalSupply: parseFloat(ethers.utils.formatUnits(totalSupply, 18))
    };
  } catch (error) {
    console.error("[getGlobalStats] Error fetching global stats (connected):", error);
    // Return default values if there's an error
    return {
      totalMined: 0,
      remainingSupply: 777777000,
      totalSupply: 777777000
    };
  }
};

// Subscribe to transaction status updates
export const subscribeToTransaction = (txHash, callback) => {
  if (!txHash) return;
  
  transactionListeners[txHash] = callback;
  
  // Start tracking the transaction
  trackTransaction(txHash);
};

// Unsubscribe from transaction updates
export const unsubscribeFromTransaction = (txHash) => {
  if (transactionListeners[txHash]) {
    delete transactionListeners[txHash];
  }
};

// Track transaction status
const trackTransaction = async (txHash) => {
  if (!provider) return;
  
  try {
    // Initial status update - pending
    if (transactionListeners[txHash]) {
      transactionListeners[txHash]({
        status: TX_STATUS.PENDING,
        txHash,
        confirmations: 0
      });
    }
    
    // Wait for transaction to be mined
    const receipt = await provider.waitForTransaction(txHash);
    
    // Check if transaction was successful
    const status = receipt.status === 1 ? TX_STATUS.CONFIRMED : TX_STATUS.FAILED;
    
    // Notify listener
    if (transactionListeners[txHash]) {
      transactionListeners[txHash]({
        status,
        txHash,
        confirmations: 1,
        receipt
      });
    }
  } catch (error) {
    console.error("Transaction tracking error:", error);
    if (transactionListeners[txHash]) {
      // Provide more user-friendly error messages
      let userFriendlyError = "Transaction failed. Please try again later.";
      
      if (error.message.includes("transaction receipt not found")) {
        userFriendlyError = "Blockchain network is busy. Your transaction timed out. Please try again later.";
      }
      
      transactionListeners[txHash]({
        status: TX_STATUS.FAILED,
        txHash,
        error: userFriendlyError
      });
    }
  }
};

// Pray for faith tokens
export const prayForFaith = async () => {
  if (!faithTokenContract) throw new Error("Contract not initialized");
  
  try {
    const tx = await faithTokenContract.mine();
    
    // Return just the transaction hash, not an object
    return tx.hash;
  } catch (error) {
    console.error("Prayer error:", error);
    
    // Provide more user-friendly error messages
    if (error.code === "ACTION_REJECTED") {
      throw new Error("Prayer requires your signature to confirm the transaction. Please confirm in your wallet to continue.");
    } else if (error.message.includes("insufficient funds")) {
      throw new Error("Your account has insufficient funds to pay for transaction fees. Please ensure you have enough STT.");
    } else {
      throw error; // Other errors remain unchanged
    }
  };
};

// Get top holders
export const getTopHolders = async () => {
  return []; // Return empty array as we're not using this anymore
}; 