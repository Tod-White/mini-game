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

// Factory contract ABI
const FactoryABI = [
  // Read-only functions
  "function faithToken() view returns (address)",
  "function requiredBurnAmount() view returns (uint256)",
  "function getDeployedTokenCount() view returns (uint256)",
  "function getTokenByIndex(uint256 index) view returns (tuple(string name, string symbol, address tokenAddress, address creator, uint256 totalSupply, uint256 timestamp))",
  "function getTokenByAddress(address tokenAddress) view returns (tuple(string name, string symbol, address tokenAddress, address creator, uint256 totalSupply, uint256 timestamp))",
  "function getTokensByCreator(address creator) view returns (tuple(string name, string symbol, address tokenAddress, address creator, uint256 totalSupply, uint256 timestamp)[])",
  "function getAllTokens() view returns (tuple(string name, string symbol, address tokenAddress, address creator, uint256 totalSupply, uint256 timestamp)[])",
  
  // Write functions
  "function createToken(string name, string symbol, uint256 totalSupply) returns (address)",
  
  // Events
  "event TokenDeployed(address indexed tokenAddress, string name, string symbol, address indexed creator, uint256 totalSupply, uint256 timestamp)",
  "event BurnAmountChanged(uint256 oldAmount, uint256 newAmount)"
];

// FAITH Token ABI
const FaithTokenABI = [
  // Read-only functions
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
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

// Prayer Token ABI (deployed tokens)
const PrayerTokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function mine() external",
  "function getMinerStats(address miner) external view returns (uint256)",
  "function getRemainingSupply() external view returns (uint256)",
  "function totalMined() external view returns (uint256)",
  "function TOKENS_PER_MINE() external view returns (uint256)",
  "function MAX_SUPPLY() external view returns (uint256)",
  "event Mining(address indexed miner, uint256 amount, uint256 timestamp)",
  "event MiningExhausted(uint256 totalMined, uint256 timestamp)"
];

// Constants
export const SOMNIA_CHAIN_ID = 50312;
export const CONTRACT_ADDRESS = '0x3E9c46064B5f8Ab4605506841076059F3e93fbb0';
export const FACTORY_ADDRESS = '0x178465595D9fDc350D28DEf432ad8684F1de48A5';
export const FAITH_TOKEN_ADDRESS = '0x3E9c46064B5f8Ab4605506841076059F3e93fbb0';
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
let factoryContract;
let faithTokenContract;
let networkSwitchListeners = [];

// Transaction listeners
const transactionListeners = {};

// Event listeners
const eventListeners = {
  mining: [],
  transfer: [],
  exhausted: [],
  tokenDeployed: []
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
    
    // Initialize contract connections
    faithTokenContract = new Contract(CONTRACT_ADDRESS, FaithTokenABI, signer);
    factoryContract = new Contract(FACTORY_ADDRESS, FactoryABI, signer);
    
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
      amount: formatUnits(amount, 18),
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
      value: formatUnits(value, 18)
    };
    
    console.log("Transfer event:", event);
    
    // Notify all listeners
    eventListeners.transfer.forEach(callback => callback(event));
  });
  
  // MiningExhausted event
  faithTokenContract.on("MiningExhausted", (totalMined, timestamp) => {
    const event = {
      totalMined: formatUnits(totalMined, 18),
      timestamp: timestamp.toNumber(),
      date: new Date(timestamp.toNumber() * 1000)
    };
    
    console.log("Prayer exhausted event:", event);
    
    // Notify all listeners
    eventListeners.exhausted.forEach(callback => callback(event));
  });
  
  // Add Factory contract event listeners if initialized
  if (factoryContract) {
    // TokenDeployed event
    factoryContract.on("TokenDeployed", (tokenAddress, name, symbol, creator, totalSupply, timestamp) => {
      const event = {
        tokenAddress,
        name,
        symbol,
        creator,
        totalSupply: formatUnits(totalSupply, 18),
        timestamp: timestamp.toNumber(),
        date: new Date(timestamp.toNumber() * 1000)
      };
      
      console.log("Token deployed event:", event);
      
      // Notify all listeners
      eventListeners.tokenDeployed.forEach(callback => callback(event));
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
  if ((faithTokenContract || factoryContract) && eventListeners[eventName].length === 1) {
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
        const ethereumProvider = new BrowserProvider(window.ethereum);
        const network = await ethereumProvider.getNetwork();
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
  return formatUnits(balance, 18);
};

// Get miner stats
export const getMinerStats = async (address) => {
  if (!faithTokenContract) throw new Error("Contract not initialized");
  
  const stats = await faithTokenContract.getMinerStats(address);
  return formatUnits(stats, 18);
};

// Get global stats about the contract
export const getGlobalStats = async () => {
  try {
    if (!faithTokenContract) {
      console.log("Contract not initialized, creating read-only instance...");
      
      // Create a read-only contract instance
      const readProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
      const readOnlyContract = new Contract(CONTRACT_ADDRESS, FaithTokenABI, readProvider);
    
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
    const totalMined = await faithTokenContract.totalMined();
    const remainingSupply = await faithTokenContract.getRemainingSupply();
    const totalSupply = await faithTokenContract.MAX_SUPPLY();
    
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

// Mine (pray) for Faith tokens
export const prayForFaith = async () => {
  if (!faithTokenContract || !signer) {
    throw new Error("Contract or signer not initialized");
  }
  
  try {
    const tx = await faithTokenContract.mine();
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

// =================== FACTORY CONTRACT FUNCTIONS ===================

// Get the required burn amount for token deployment
export const getRequiredBurnAmount = async () => {
  try {
    if (!factoryContract) {
      console.log("Factory contract not initialized, creating read-only instance...");
      // Create a read-only contract instance
      const readProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
      const readOnlyContract = new Contract(FACTORY_ADDRESS, FactoryABI, readProvider);
      
      const burnAmount = await readOnlyContract.requiredBurnAmount();
      return formatUnits(burnAmount, 18);
    }
    
    const burnAmount = await factoryContract.requiredBurnAmount();
    return formatUnits(burnAmount, 18);
  } catch (error) {
    console.error("Error getting required burn amount:", error);
    throw error;
  }
};

// Get FAITH token balance
export const getFaithBalance = async (address) => {
  try {
    if (!faithTokenContract) {
      console.log("FAITH token contract not initialized, creating read-only instance...");
      const readProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
      const readOnlyContract = new Contract(FAITH_TOKEN_ADDRESS, FaithTokenABI, readProvider);
      
      const balance = await readOnlyContract.balanceOf(address);
      return formatUnits(balance, 18);
    }
    
    const balance = await faithTokenContract.balanceOf(address);
    return formatUnits(balance, 18);
  } catch (error) {
    console.error("Error getting FAITH balance:", error);
    throw error;
  }
};

// Check if factory has allowance to spend FAITH tokens
export const getFaithAllowance = async (ownerAddress) => {
  try {
    if (!faithTokenContract) {
      console.log("FAITH token contract not initialized, creating read-only instance...");
      const readProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
      const readOnlyContract = new Contract(FAITH_TOKEN_ADDRESS, FaithTokenABI, readProvider);
      
      const allowance = await readOnlyContract.allowance(ownerAddress, FACTORY_ADDRESS);
      return formatUnits(allowance, 18);
    }
    
    const allowance = await faithTokenContract.allowance(ownerAddress, FACTORY_ADDRESS);
    return formatUnits(allowance, 18);
  } catch (error) {
    console.error("Error getting FAITH allowance:", error);
    throw error;
      }
};

// Approve factory to spend FAITH tokens
export const approveFaithForFactory = async (amount) => {
  if (!faithTokenContract || !signer) {
    throw new Error("FAITH token contract or signer not initialized");
  }
  
  try {
    const amountWei = parseUnits(amount.toString(), 18);
    const tx = await faithTokenContract.approve(FACTORY_ADDRESS, amountWei);
    console.log("FAITH approval transaction sent:", tx.hash);
    
    // Track transaction
    trackTransaction(tx.hash);
    
    return tx.hash;
  } catch (error) {
    console.error("FAITH approval error:", error);
    throw error;
  }
};

// Deploy a new prayer token
export const deployPrayerToken = async (name, symbol, totalSupply) => {
  if (!factoryContract || !signer) {
    throw new Error("Factory contract or signer not initialized");
  }
  
  try {
    const tx = await factoryContract.createToken(name, symbol, totalSupply);
    console.log("Token deployment transaction sent:", tx.hash);
    
    // Track transaction
    trackTransaction(tx.hash);
    
    return tx.hash;
  } catch (error) {
    console.error("Token deployment error:", error);
    throw error;
  }
};

// Get the total number of deployed tokens
export const getDeployedTokenCount = async () => {
  try {
    if (!factoryContract) {
      console.log("Factory contract not initialized, creating read-only instance...");
      const readProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
      const readOnlyContract = new Contract(FACTORY_ADDRESS, FactoryABI, readProvider);
      
      return Number(await readOnlyContract.getDeployedTokenCount());
    }
    
    return Number(await factoryContract.getDeployedTokenCount());
  } catch (error) {
    console.error("Error getting deployed token count:", error);
    throw error;
  }
};

// Get token by index
export const getTokenByIndex = async (index) => {
  try {
    if (!factoryContract) {
      console.log("Factory contract not initialized, creating read-only instance...");
      const readProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
      const readOnlyContract = new Contract(FACTORY_ADDRESS, FactoryABI, readProvider);
      
      const token = await readOnlyContract.getTokenByIndex(index);
      return formatTokenInfo(token);
    }
    
    const token = await factoryContract.getTokenByIndex(index);
    return formatTokenInfo(token);
  } catch (error) {
    console.error(`Error getting token at index ${index}:`, error);
    throw error;
  }
};

// Get all deployed tokens
export const getAllTokens = async () => {
  try {
    if (!factoryContract) {
      console.log("Factory contract not initialized, creating read-only instance...");
      const readProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
      const readOnlyContract = new Contract(FACTORY_ADDRESS, FactoryABI, readProvider);
      
      const tokens = await readOnlyContract.getAllTokens();
      return tokens.map(formatTokenInfo);
    }
    
    const tokens = await factoryContract.getAllTokens();
    return tokens.map(formatTokenInfo);
  } catch (error) {
    console.error("Error getting all tokens:", error);
    throw error;
  }
};

// Get tokens created by a specific address
export const getTokensByCreator = async (creatorAddress) => {
  try {
    if (!factoryContract) {
      console.log("Factory contract not initialized, creating read-only instance...");
      const readProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
      const readOnlyContract = new Contract(FACTORY_ADDRESS, FactoryABI, readProvider);
      
      const tokens = await readOnlyContract.getTokensByCreator(creatorAddress);
      return tokens.map(formatTokenInfo);
    }
    
    const tokens = await factoryContract.getTokensByCreator(creatorAddress);
    return tokens.map(formatTokenInfo);
  } catch (error) {
    console.error(`Error getting tokens for creator ${creatorAddress}:`, error);
    throw error;
  }
};

// Get token details by address
export const getTokenByAddress = async (tokenAddress) => {
  try {
    if (!factoryContract) {
      console.log("Factory contract not initialized, creating read-only instance...");
      const readProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
      const readOnlyContract = new Contract(FACTORY_ADDRESS, FactoryABI, readProvider);
      
      const token = await readOnlyContract.getTokenByAddress(tokenAddress);
      return formatTokenInfo(token);
    }
    
    const token = await factoryContract.getTokenByAddress(tokenAddress);
    return formatTokenInfo(token);
  } catch (error) {
    console.error(`Error getting token at address ${tokenAddress}:`, error);
    throw error;
  }
};

// Get details for a specific Prayer token (not from factory)
export const getPrayerTokenDetails = async (tokenAddress) => {
  try {
    // Create a read-only contract instance for the specific prayer token
    const readProvider = new JsonRpcProvider(SOMNIA_RPC_URL);
    const tokenContract = new Contract(tokenAddress, PrayerTokenABI, readProvider);

    // Get basic token info
    const [name, symbol, totalSupply, totalMined, remainingSupply, tokensPerMine] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.MAX_SUPPLY(),
      tokenContract.totalMined(),
      tokenContract.getRemainingSupply(),
      tokenContract.TOKENS_PER_MINE()
    ]);
    
    return {
      name,
      symbol,
      address: tokenAddress,
      totalSupply: formatUnits(totalSupply, 18),
      totalMined: formatUnits(totalMined, 18),
      remainingSupply: formatUnits(remainingSupply, 18),
      tokensPerMine: formatUnits(tokensPerMine, 18),
      progress: totalSupply > 0 ? (Number(totalMined) / Number(totalSupply)) * 100 : 0
    };
  } catch (error) {
    console.error(`Error getting prayer token details for ${tokenAddress}:`, error);
    throw error;
  }
};

// Pray for a specific Prayer token
export const prayForToken = async (tokenAddress) => {
  try {
    if (!signer) {
      throw new Error("Signer not initialized");
    }
    
    // Create contract instance for the specific prayer token
    const tokenContract = new Contract(tokenAddress, PrayerTokenABI, signer);
    
    // Call mine() function
    const tx = await tokenContract.mine();
    console.log(`Prayer transaction sent for token ${tokenAddress}:`, tx.hash);
    
    // Track transaction
    trackTransaction(tx.hash);
    
    return tx.hash;
  } catch (error) {
    console.error(`Error praying for token at ${tokenAddress}:`, error);
    throw error;
  }
};

// Format token info from contract response
const formatTokenInfo = (token) => {
  // Convert timestamp to number safely
  const timestampNum = typeof token.timestamp.toNumber === 'function' 
    ? token.timestamp.toNumber() 
    : Number(token.timestamp);
  
  return {
    name: token.name,
    symbol: token.symbol,
    tokenAddress: token.tokenAddress,
    creator: token.creator,
    totalSupply: formatUnits(token.totalSupply, 18),
    timestamp: timestampNum,
    date: new Date(timestampNum * 1000)
  };
}; 