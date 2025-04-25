/* global BigInt */
import { 
  BrowserProvider, 
  JsonRpcProvider, 
  Contract,
  formatUnits, 
  parseUnits 
} from 'ethers';
import TokenFactoryABI from './contracts/TokenFactory.json';

// Contract ABI - replace with the actual ABI from your compiled contract
const MineableTokenABI = [
  // Read-only functions
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalMined() view returns (uint256)",
  "function getRemainingSupply() view returns (uint256)",
  "function getMinerStats(address miner) view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function canPray(address user) view returns (bool)",
  "function getPrayerCooldown(address user) view returns (uint256)",
  
  // Write functions
  "function pray() returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Prayer(address indexed user, uint256 amount, uint256 timestamp)",
  "event PrayerExhausted(uint256 totalMined, uint256 timestamp)"
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

// Add TokenFactory contract address
export const TOKEN_FACTORY_ADDRESS = '0xA1DDE5c3C1B35bF8317dbAB03beDCd7a2DE699FD';

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
    const isCorrectNetwork = network.chainId === BigInt(SOMNIA_CHAIN_ID);
    
    // If not on correct network, try to switch
    if (!isCorrectNetwork) {
      try {
        await switchToSomniaNetwork();
        // Re-check network after switch
        const updatedNetwork = await provider.getNetwork();
        const nowCorrect = updatedNetwork.chainId === BigInt(SOMNIA_CHAIN_ID);
        
        // Notify listeners about the current network status
        networkSwitchListeners.forEach(callback => {
          callback(nowCorrect);
        });
        
        return { 
          account: accounts[0], 
          isCorrectNetwork: nowCorrect,
          network: updatedNetwork
        };
      } catch (switchError) {
        console.error("Failed to switch network:", switchError);
        return { 
          account: accounts[0], 
          isCorrectNetwork: false,
          network: network
        };
      }
    }
    
    // Initialize contract connection only if on correct network
    if (isCorrectNetwork) {
      karmaTokenContract = new Contract(CONTRACT_ADDRESS, MineableTokenABI, signer);
      setupEventListeners();
    }
    
    return { 
      account: accounts[0], 
      isCorrectNetwork: isCorrectNetwork,
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
  
  // Prayer event
  karmaTokenContract.on("Prayer", (user, amount, timestamp) => {
    const event = {
      miner: user,
      amount: formatUnits(amount, 18),
      timestamp: Number(timestamp),
      date: new Date(Number(timestamp) * 1000)
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
  
  // PrayerExhausted event
  if (eventListeners.exhausted.length > 0) {
    karmaTokenContract.on("PrayerExhausted", (totalMined, timestamp) => {
      const event = {
        totalMined: formatUnits(totalMined, 18),
        timestamp: Number(timestamp),
        date: new Date(Number(timestamp) * 1000)
      };
      
      console.log("Prayer exhausted event:", event);
      
      // Notify all listeners
      eventListeners.exhausted.forEach(callback => callback(event));
    });
  }
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
        const isCorrectNetwork = network.chainId === BigInt(SOMNIA_CHAIN_ID);
        
        // Initialize contract if on correct network
        if (isCorrectNetwork) {
          const signer = await provider.getSigner();
          karmaTokenContract = new Contract(CONTRACT_ADDRESS, MineableTokenABI, signer);
        }
        
        networkSwitchListeners.forEach(callback => {
          callback(isCorrectNetwork);
        });
      } catch (error) {
        console.error("Error in initial network check:", error);
      }
    }, 100);
    
    // Listen for chain changes
    window.ethereum.on('chainChanged', async (chainIdHex) => {
      try {
        const chainId = parseInt(chainIdHex, 16);
        const isCorrectNetwork = chainId === SOMNIA_CHAIN_ID;
        
        // Re-initialize contract if on correct network
        if (isCorrectNetwork) {
          provider = new BrowserProvider(window.ethereum);
          signer = await provider.getSigner();
          karmaTokenContract = new Contract(CONTRACT_ADDRESS, MineableTokenABI, signer);
        }
        
        console.log(`Chain changed to: ${chainId}, correct network: ${isCorrectNetwork}`);
        
        networkSwitchListeners.forEach(callback => {
          callback(isCorrectNetwork);
        });
      } catch (error) {
        console.error("Error handling chain change:", error);
      }
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
    
    // Wait a bit for the switch to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Initialize provider and contract after switch
    provider = new BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    karmaTokenContract = new Contract(CONTRACT_ADDRESS, MineableTokenABI, signer);
    
    return true;
  } catch (error) {
    // If the network doesn't exist, add it
    if (error.code === 4902) {
      try {
        await addSomniaNetwork();
        
        // Wait a bit for the network to be added
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Initialize provider and contract after adding network
        provider = new BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        karmaTokenContract = new Contract(CONTRACT_ADDRESS, MineableTokenABI, signer);
        
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
export const getBalance = async (address, tokenAddress = CONTRACT_ADDRESS) => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const tokenContract = new Contract(tokenAddress, MineableTokenABI, provider);
  
    const balance = await tokenContract.balanceOf(address);
    return formatUnits(balance, 18);
  } catch (error) {
    console.error("Error getting balance:", error);
    return "0";
  }
};

// Get miner stats
export const getMinerStats = async (address, tokenAddress = CONTRACT_ADDRESS) => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const tokenContract = new Contract(tokenAddress, MineableTokenABI, provider);
  
    const stats = await tokenContract.getMinerStats(address);
    return formatUnits(stats, 18);
  } catch (error) {
    console.error("Error getting miner stats:", error);
    return "0";
  }
};

// Get global statistics
export const getGlobalStats = async (tokenAddress = CONTRACT_ADDRESS) => {
  // Initialize a read-only provider for non-authenticated users
  const readOnlyProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
  const tokenContract = new Contract(tokenAddress, MineableTokenABI, readOnlyProvider);
  
  try {
    // Get statistics from the contract
    const totalMined = await tokenContract.totalMined();
    const remainingSupply = await tokenContract.getRemainingSupply();
    const totalSupply = await tokenContract.maxSupply();
    
    return {
      totalMined: parseFloat(formatUnits(totalMined, 18)),
      remainingSupply: parseFloat(formatUnits(remainingSupply, 18)),
      totalSupply: parseFloat(formatUnits(totalSupply, 18))
    };
  } catch (error) {
    console.error("Error fetching global stats:", error);
    // Return default values if there's an error
    return {
      totalMined: 0,
      remainingSupply: 77770000,
      totalSupply: 77770000
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

// Pray for tokens
export const pray = async (tokenAddress = CONTRACT_ADDRESS) => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new Contract(tokenAddress, MineableTokenABI, signer);
    
    // Check if there are tokens available to pray for
    const remainingSupply = await tokenContract.getRemainingSupply();
    if (remainingSupply.toString() === "0") {
      throw new Error("No tokens left to pray for");
    }

    // Check if user can pray (cooldown period)
    const canPrayNow = await tokenContract.canPray(await signer.getAddress());
    if (!canPrayNow) {
      throw new Error("Please wait before praying again");
    }

    // Perform the prayer transaction
    const tx = await tokenContract.pray();
    const receipt = await tx.wait();

    return {
      success: true,
      hash: tx.hash,
      receipt
    };
  } catch (error) {
    console.error("Error praying:", error);
    throw error;
  }
};

// Check if user can pray
export const canPray = async (address, tokenAddress = CONTRACT_ADDRESS) => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const tokenContract = new Contract(tokenAddress, MineableTokenABI, provider);
    return await tokenContract.canPray(address);
  } catch (error) {
    console.error("Error checking if can pray:", error);
    return false;
  }
};

// Get prayer cooldown
export const getPrayerCooldown = async (address, tokenAddress = CONTRACT_ADDRESS) => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const tokenContract = new Contract(tokenAddress, MineableTokenABI, provider);
    const cooldown = await tokenContract.getPrayerCooldown(address);
    return Number(cooldown);
  } catch (error) {
    console.error("Error getting prayer cooldown:", error);
    return 0;
  }
};

// Legacy function for backward compatibility
export const prayForKarma = () => pray(CONTRACT_ADDRESS);

// Get top holders
export const getTopHolders = async () => {
  return []; // Return empty array as we're not using this anymore
};

// Deploy a new token
export const deployToken = async (name, symbol, totalSupply) => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    const tokenFactory = new Contract(
      TOKEN_FACTORY_ADDRESS,
      TokenFactoryABI.abi,
      signer
    );

    // Convert totalSupply to wei (18 decimals)
    const totalSupplyWei = parseUnits(totalSupply.toString(), 18);
    
    // Deploy the token with just the 3 required parameters
    const tx = await tokenFactory.deployToken(
      name,
      symbol,
      totalSupplyWei
    );

    // Wait for deployment
    const receipt = await tx.wait();
    
    // Get the deployed token address from the event
    const event = receipt.logs[0]; // The TokenDeployed event should be the first and only event
    const parsedLog = tokenFactory.interface.parseLog({
      topics: event.topics,
      data: event.data
    });
    const tokenAddress = parsedLog.args[0]; // The token address is the first argument

    if (!tokenAddress) {
      throw new Error('Could not get deployed token address from transaction');
    }

    return tokenAddress;
  } catch (error) {
    console.error('Error deploying token:', error);
    throw error;
  }
};

// Get list of deployed tokens
export const getDeployedTokens = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new BrowserProvider(window.ethereum);
    const tokenFactory = new Contract(
      TOKEN_FACTORY_ADDRESS,
      TokenFactoryABI.abi,
      provider
    );

    // Get all token addresses
    const tokenAddresses = await tokenFactory.getDeployedTokens();
    
    // Get details for each token
    const tokens = await Promise.all(tokenAddresses.map(async (address) => {
      const token = new Contract(address, MineableTokenABI, provider);
      try {
        const [name, symbol, totalSupply, remainingSupply] = await Promise.all([
          token.name(),
          token.symbol(),
          token.totalSupply(),
          token.getRemainingSupply()
        ]);

        return {
          address,
          name,
          symbol,
          totalSupply: formatUnits(totalSupply, 18),
          remainingSupply: formatUnits(remainingSupply, 18),
          deployedDate: new Date().toLocaleDateString()
        };
      } catch (error) {
        console.error(`Error fetching details for token ${address}:`, error);
        return null;
      }
    }));

    // Filter out any failed token fetches
    return tokens.filter(token => token !== null);
  } catch (error) {
    console.error('Error getting deployed tokens:', error);
    throw new Error('Failed to get deployed tokens');
  }
};

// Get token details
export const getTokenDetails = async (tokenAddress) => {
  try {
    if (!tokenAddress) {
      throw new Error('Token address is required');
    }

    const provider = new BrowserProvider(window.ethereum);
    const contract = new Contract(tokenAddress, MineableTokenABI, provider);

    const [name, symbol, totalSupply, remainingSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.totalSupply(),
      contract.getRemainingSupply()
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      totalSupply: formatUnits(totalSupply, 18),
      remainingSupply: formatUnits(remainingSupply, 18)
    };
  } catch (error) {
    console.error('Error in getTokenDetails:', error);
    throw new Error('Failed to get token details');
  }
};

// Get user's token stats
export const getUserTokenStats = async (userAddress, tokenAddress) => {
  if (!tokenAddress || tokenAddress === CONTRACT_ADDRESS) {
    throw new Error('Invalid token address');
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const tokenContract = new Contract(tokenAddress, MineableTokenABI, provider);

    // Get user's token data
    const [balance, mined, canPrayNow, cooldown] = await Promise.all([
      tokenContract.balanceOf(userAddress),
      tokenContract.getMinerStats(userAddress),
      tokenContract.canPray(userAddress),
      tokenContract.getPrayerCooldown(userAddress)
    ]);

    return {
      balance: formatUnits(balance, 18),
      mined: formatUnits(mined, 18),
      canPray: canPrayNow,
      cooldownEnds: Number(cooldown)
    };
  } catch (error) {
    console.error('Error getting user token stats:', error);
    throw new Error('Failed to get user token stats');
  }
};

// Subscribe to token events
export const subscribeToTokenEvents = (tokenAddress, callbacks) => {
  if (!tokenAddress || tokenAddress === CONTRACT_ADDRESS) {
    throw new Error('Invalid token address');
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const tokenContract = new Contract(tokenAddress, MineableTokenABI, provider);

    // Subscribe to Mining events
    if (callbacks.onPrayer) {
      tokenContract.on("Prayer", (user, amount, timestamp) => {
        callbacks.onPrayer({
          miner: user,
          amount: formatUnits(amount, 18),
          timestamp: Number(timestamp),
          date: new Date(Number(timestamp) * 1000)
        });
      });
    }

    // Subscribe to MiningExhausted events
    if (callbacks.onExhausted) {
      tokenContract.on("PrayerExhausted", (totalMined, timestamp) => {
        callbacks.onExhausted({
          totalMined: formatUnits(totalMined, 18),
          timestamp: Number(timestamp),
          date: new Date(Number(timestamp) * 1000)
        });
      });
    }

    // Return unsubscribe function
    return () => {
      tokenContract.removeAllListeners();
    };
  } catch (error) {
    console.error('Error subscribing to token events:', error);
    throw new Error('Failed to subscribe to token events');
  }
};

// Cache for token details
const tokenDetailsCache = new Map();
const TOKEN_CACHE_DURATION = 30000; // 30 seconds

// Get cached token details or fetch new ones
export const getCachedTokenDetails = async (tokenAddress) => {
  const now = Date.now();
  const cached = tokenDetailsCache.get(tokenAddress);

  if (cached && (now - cached.timestamp) < TOKEN_CACHE_DURATION) {
    return cached.data;
  }

  const details = await getTokenDetails(tokenAddress);
  tokenDetailsCache.set(tokenAddress, {
    data: details,
    timestamp: now
  });

  return details;
}; 