const { 
  ethers, 
  BrowserProvider, 
  Contract, 
  formatUnits, 
  JsonRpcProvider, 
  parseUnits 
} = require('ethers');

// Contract ABI - replace with the actual ABI from your compiled contract
const KarmaTokenABI = [
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
export const CONTRACT_ADDRESS = '0xD3D811fE6eDb5f477C1eD985DC8D9633853C675e';
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
let karmaTokenContract;
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
    provider = new BrowserProvider(window.ethereum);
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
    karmaTokenContract = new Contract(CONTRACT_ADDRESS, KarmaTokenABI, signer);
    
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
  if (!karmaTokenContract) return;
  
  // Mining event
  karmaTokenContract.on("Mining", (miner, amount, timestamp) => {
    const event = {
      miner,
      amount: formatUnits(amount, 18),
      timestamp: timestamp.toNumber(),
      date: new Date(timestamp.toNumber() * 1000)
    };
    
    console.log("Prayer event:", event);
    
    // Notify all listeners
    eventListeners.mining.forEach(callback => callback(event));
  });
  
  // Transfer event
  karmaTokenContract.on("Transfer", (from, to, value) => {
    const event = {
      from,
      to,
      value: formatUnits(value, 18)
    };
    
    console.log("Transfer event:", event);
    
    // Notify all listeners
    eventListeners.transfer.forEach(callback => callback(event));
  });
  
  // MiningExhausted event
  karmaTokenContract.on("MiningExhausted", (totalMined, timestamp) => {
    const event = {
      totalMined: formatUnits(totalMined, 18),
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
  if (karmaTokenContract && eventListeners[eventName].length === 1) {
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
        const provider = new BrowserProvider(window.ethereum);
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
  if (!karmaTokenContract) throw new Error("Contract not initialized");
  
  const balance = await karmaTokenContract.balanceOf(address);
  return formatUnits(balance, 18);
};

// Get miner stats
export const getMinerStats = async (address) => {
  if (!karmaTokenContract) throw new Error("Contract not initialized");
  
  const stats = await karmaTokenContract.getMinerStats(address);
  return formatUnits(stats, 18);
};

// Get global stats about the contract
export const getGlobalStats = async () => {
  try {
    if (!karmaTokenContract) {
      console.log("Contract not initialized, creating read-only instance...");
      
      // Create a read-only contract instance
      const readProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
      const readOnlyContract = new Contract(CONTRACT_ADDRESS, KarmaTokenABI, readProvider);
      
      // Get stats from contract
      const totalMined = await readOnlyContract.totalMined();
      const remainingSupply = await readOnlyContract.getRemainingSupply();
      const totalSupply = await readOnlyContract.MAX_SUPPLY();
      
      console.log("[getGlobalStats] totalSupply:", totalSupply.toString());
      return {
        totalMined: parseFloat(formatUnits(totalMined, 18)),
        remainingSupply: parseFloat(formatUnits(remainingSupply, 18)),
        totalSupply: parseFloat(formatUnits(totalSupply, 18))
      };
    }
    
    // Get stats from initialized contract
    const totalMined = await karmaTokenContract.totalMined();
    const remainingSupply = await karmaTokenContract.getRemainingSupply();
    const totalSupply = await karmaTokenContract.MAX_SUPPLY();
    
    console.log("[getGlobalStats] totalSupply (connected):", totalSupply.toString());
    return {
      totalMined: parseFloat(formatUnits(totalMined, 18)),
      remainingSupply: parseFloat(formatUnits(remainingSupply, 18)),
      totalSupply: parseFloat(formatUnits(totalSupply, 18))
    };
  } catch (error) {
    console.error("Error getting global stats:", error);
    throw error;
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

// Track a transaction until it's confirmed
const trackTransaction = async (txHash) => {
  try {
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      // Transaction is still pending
      console.log(`Transaction ${txHash} is still pending...`);
      
      // Notify listeners
      if (transactionListeners[txHash]) {
        transactionListeners[txHash]({
          status: TX_STATUS.PENDING,
          hash: txHash
        });
      }
      
      // Check again in 5 seconds
      setTimeout(() => trackTransaction(txHash), 5000);
      return;
    }
    
    // Transaction is confirmed
    console.log(`Transaction ${txHash} confirmed with status: ${receipt.status}`);
    
    // Check transaction status
    if (receipt.status === 1) {
      // Transaction was successful
      if (transactionListeners[txHash]) {
        transactionListeners[txHash]({
          status: TX_STATUS.CONFIRMED,
          hash: txHash,
          blockNumber: receipt.blockNumber,
          gasUsed: formatUnits(receipt.gasUsed, 0)
        });
      }
    } else {
      // Transaction failed
      console.error(`Transaction ${txHash} failed`);
      
      if (transactionListeners[txHash]) {
        transactionListeners[txHash]({
          status: TX_STATUS.FAILED,
          hash: txHash,
          error: "Transaction failed on the blockchain"
        });
      }
    }
  } catch (error) {
    console.error(`Error tracking transaction ${txHash}:`, error);
    
    if (transactionListeners[txHash]) {
      transactionListeners[txHash]({
        status: TX_STATUS.FAILED,
        hash: txHash,
        error: error.message
      });
    }
  }
};

// Mine (pray) for Karma tokens
export const prayForKarma = async () => {
  if (!karmaTokenContract || !signer) {
    throw new Error("Contract or signer not initialized");
  }
  
  try {
    const tx = await karmaTokenContract.mine();
    console.log("Prayer transaction sent:", tx.hash);
    
    // Start tracking transaction
    trackTransaction(tx.hash);
    
    return tx.hash;
  } catch (error) {
    console.error("Prayer error:", error);
    throw error;
  }
};

// Get top token holders
export const getTopHolders = async () => {
  try {
    // This is just a placeholder - in a real application,
    // you would need an indexer or backend service to track token holders
    // as this data can't be easily fetched directly from the contract
    
    // For demonstration purposes, let's return a static list
    return [
      { address: '0x1234...', balance: '10000' },
      { address: '0x5678...', balance: '5000' },
      { address: '0x9abc...', balance: '2500' }
    ];
  } catch (error) {
    console.error("Error fetching top holders:", error);
    throw error;
  }
}; 