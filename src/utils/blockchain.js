import { ethers } from 'ethers';
import { 
  recordPrayer, 
  getUserPrayerStats, 
  getGlobalPrayerStats, 
  subscribeToBatchEvents 
} from './etherbaseClient';

// Contract ABI - replace with the actual ABI from your compiled contract
const FaithTokenABI = [
  // Read-only functions
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  
  // Faith token functions
  "function getPrayerStats(address user) external view returns (uint256)",
  "function getRemainingSupply() external view returns (uint256)",
  "function totalMined() external view returns (uint256)",
  "function TOKENS_PER_PRAYER() external view returns (uint256)",
  "function MAX_SUPPLY() external view returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event PrayerProcessed(address indexed user, uint256 amount, uint256 timestamp)",
  "event BatchProcessed(uint256 userCount, uint256 totalAmount, uint256 timestamp)"
];

// Constants
export const SOMNIA_CHAIN_ID = 50312;
export const CONTRACT_ADDRESS = '0x4DDc95c8108F997b0Cf6998a99B3d913c802d5B7'; // Update with FaithToken address
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
let currentAccount = null;

// Transaction listeners
const transactionListeners = {};

// Event listeners
const eventListeners = {
  prayer: [],
  transfer: [],
  batchProcessed: []
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
    currentAccount = accounts[0];
    
    // Set up provider and signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    
    // Get current network
    const network = await provider.getNetwork();
    const isCorrectNetwork = network.chainId === SOMNIA_CHAIN_ID;
    
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
  
  // PrayerProcessed event
  faithTokenContract.on("PrayerProcessed", (user, amount, timestamp) => {
    const event = {
      user,
      amount: ethers.utils.formatUnits(amount, 18),
      timestamp: timestamp.toNumber(),
      date: new Date(timestamp.toNumber() * 1000)
    };
    
    console.log("Prayer processed event:", event);
    
    // Notify all listeners
    eventListeners.prayer.forEach(callback => callback(event));
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
  
  // BatchProcessed event
  faithTokenContract.on("BatchProcessed", (userCount, totalAmount, timestamp) => {
    const event = {
      userCount: userCount.toNumber(),
      totalAmount: ethers.utils.formatUnits(totalAmount, 18),
      timestamp: timestamp.toNumber(),
      date: new Date(timestamp.toNumber() * 1000)
    };
    
    console.log("Batch processed event:", event);
    
    // Notify all listeners
    eventListeners.batchProcessed.forEach(callback => callback(event));
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
        const isCorrectNetwork = network.chainId === SOMNIA_CHAIN_ID;
        
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
        const isCorrectNetwork = chainId === SOMNIA_CHAIN_ID;
        
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

// Get confirmed balance from the blockchain
export const getBalance = async (address) => {
  if (!faithTokenContract) throw new Error("Contract not initialized");
  
  const balance = await faithTokenContract.balanceOf(address);
  return ethers.utils.formatUnits(balance, 18);
};

// Get user's prayer stats from the blockchain
export const getPrayerStats = async (address) => {
  if (!faithTokenContract) throw new Error("Contract not initialized");
  
  const stats = await faithTokenContract.getPrayerStats(address);
  return ethers.utils.formatUnits(stats, 18);
};

// Get combined user stats (both blockchain and Etherbase)
export const getUserStats = async (address) => {
  try {
    // Get confirmed stats from blockchain
    const confirmedStats = await getPrayerStats(address);
    const balance = await getBalance(address);
    
    // Get pending stats from Etherbase
    const etherbaseStats = await getUserPrayerStats(address);
    
    return {
      confirmedPrayers: parseFloat(confirmedStats),
      pendingPrayers: etherbaseStats.pendingPrayers,
      totalPrayers: etherbaseStats.totalPrayers,
      balance: parseFloat(balance),
      lastPrayTime: etherbaseStats.lastPrayTime,
      lastClaimTime: etherbaseStats.lastClaimTime
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      confirmedPrayers: 0,
      pendingPrayers: 0,
      totalPrayers: 0,
      balance: 0,
      lastPrayTime: 0,
      lastClaimTime: 0
    };
  }
};

// Get global statistics
export const getGlobalStats = async () => {
  try {
    // Initialize a read-only provider for non-authenticated users
    const readOnlyProvider = new ethers.providers.JsonRpcProvider(SOMNIA_RPC_URL);
    
    // Use read-only contract if main contract isn't initialized
    const contract = faithTokenContract || new ethers.Contract(CONTRACT_ADDRESS, FaithTokenABI, readOnlyProvider);
    
    // Get statistics from the contract
    const totalMined = await contract.totalMined();
    const remainingSupply = await contract.getRemainingSupply();
    const totalSupply = await contract.MAX_SUPPLY();
    
    // Get Etherbase global stats
    const etherbaseStats = await getGlobalPrayerStats();
    
    return {
      totalMined: parseFloat(ethers.utils.formatUnits(totalMined, 18)),
      remainingSupply: parseFloat(ethers.utils.formatUnits(remainingSupply, 18)),
      totalSupply: parseFloat(ethers.utils.formatUnits(totalSupply, 18)),
      pendingPrayers: etherbaseStats.totalPendingPrayers,
      processedPrayers: etherbaseStats.totalProcessedPrayers,
      batches: etherbaseStats.batches
    };
  } catch (error) {
    console.error("Error fetching global stats:", error);
    // Return default values if there's an error
    return {
      totalMined: 0,
      remainingSupply: 666666666,
      totalSupply: 666666666,
      pendingPrayers: 0,
      processedPrayers: 0,
      batches: 0
    };
  }
};

// Subscribe to batch processing
export const subscribeToBatchProcessing = (callback) => {
  // Subscribe to batch events via Etherbase
  const { error } = subscribeToBatchEvents((event) => {
    if (callback) {
      callback(event);
    }
  });
  
  if (error) {
    console.error("Error subscribing to batch processing:", error);
  }
  
  // Also subscribe to contract events for confirmed batch processing
  subscribeToEvent('batchProcessed', callback);
};

// Pray for Faith tokens (using Etherbase)
export const prayForFaith = async () => {
  if (!currentAccount) throw new Error("Wallet not connected");
  
  try {
    // Record prayer in Etherbase
    await recordPrayer(currentAccount);
    
    // Return success - no transaction hash since we're not submitting a blockchain transaction
    return { success: true };
  } catch (error) {
    console.error("Prayer error:", error);
    throw error;
  }
};