import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import PrayerHands from './components/PrayerHands';
import WalletConnector from './components/WalletConnector';
import ProgressBar from './components/ProgressBar';
import PrayerStats from './components/PrayerStats';
import PrayingAnimation from './components/PrayingAnimation';
import BackgroundParticles from './components/BackgroundParticles';
import AllocationStats from './components/AllocationStats';
import DeployToken from './components/DeployToken';
import Documentation from './components/Documentation';
import Temp from './components/Temp';
import { 
  addNetworkSwitchListener, 
  getBalance, 
  getMinerStats, 
  getGlobalStats, 
  getTokenDetails,
  getUserTokenStats,
  subscribeToTokenEvents,
  getCachedTokenDetails,
  pray,
  prayForKarma,
  subscribeToTransaction,
  unsubscribeFromTransaction,
  TX_STATUS,
  EXPLORER_URL,
  CONTRACT_ADDRESS
} from './utils/blockchain';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [prayingStatus, setMiningStatus] = useState('ready'); // ready, praying, prayed-out
  const [prayProgress, setMiningProgress] = useState(0); // 0-100
  const [prayerStats, setMinerStats] = useState({
    balance: 0,
    mined: 0,
  });
  const [globalStats, setGlobalStats] = useState({
    totalMined: 0,
    totalSupply: 77770000,
    remainingSupply: 77770000,
  });
  const [txHash, setTxHash] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [confirmations, setConfirmations] = useState(0);
  const [error, setError] = useState(null);
  const [showPrayAnimation, setShowMiningAnimation] = useState(false);
  const [recentPray, setRecentMining] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [currentPage, setCurrentPage] = useState('pray'); // 'pray', 'deploy', or 'docs'
  const [selectedToken, setSelectedToken] = useState(null);
  const [tokenDetails, setTokenDetails] = useState(null);
  const [userTokenStats, setUserTokenStats] = useState(null);
  const [unsubscribeTokenEvents, setUnsubscribeTokenEvents] = useState(null);
  const [tokenParams, setTokenParams] = useState(null);
  
  // Refs for dropdown containers
  const docRef = useRef(null);

  // Connect wallet handler
  const handleConnect = async (connectedAccount) => {
    setIsConnected(true);
    setAccount(connectedAccount);
    
    try {
      // Load user data
      await loadUserData(connectedAccount);
      
      // Load global stats
      await loadTokenData();
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data from blockchain. Please try reconnecting.");
    }
  };

  // Set up network change listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      addNetworkSwitchListener((isCorrectNetwork) => {
        console.log("Network switch listener in App.js, correct network:", isCorrectNetwork);
        setIsCorrectNetwork(isCorrectNetwork);
        
        if (!isCorrectNetwork) {
          setIsConnected(false);
          setAccount('');
          // Only set a simple error message
          setError("Please change to Somnia to proceed");
        } else {
          // Clear the network error message when switching to the correct network
          if (error === "Please change to Somnia to proceed") {
            setError(null);
          }
          
          // Reload data if we reconnect to the correct network
          if (account) {
          handleConnect(account);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, error]);

  // Set up error message handler
  useEffect(() => {
    // Replace any network-related error with simplified message
    if (error && !isCorrectNetwork && (
      error.includes('network') || 
      error.includes('chainId') || 
      error.includes('chain') ||
      error.includes('Network Error')
    )) {
      setError("Please change to Somnia to proceed");
    }
  }, [error, isCorrectNetwork]);

  // Load token data
  const loadTokenData = useCallback(async () => {
    if (!selectedToken) {
      // For Karma token, use existing functions
      try {
        const stats = await getGlobalStats();
        setGlobalStats(stats);
        
        // Calculate praying progress
        const progress = stats.totalSupply > 0 
          ? ((stats.totalSupply - stats.remainingSupply) / stats.totalSupply) * 100 
          : 0;
        
        setMiningProgress(progress);
        
        if (stats.remainingSupply <= 0) {
          setMiningStatus('prayed-out');
          setError("All Karma tokens have been prayed for! Praying is now closed.");
        } else if (prayingStatus === 'prayed-out') {
          setMiningStatus('ready');
          setError(null);
        }
      } catch (err) {
        console.error("Error loading Karma stats:", err);
    }
      return;
    }

    try {
      // Get token details
      const details = await getCachedTokenDetails(selectedToken.address);
      setTokenDetails(details);
      
      // Update global stats
      setGlobalStats({
        totalMined: Number(details.totalMined),
        remainingSupply: Number(details.remainingSupply),
        totalSupply: Number(details.totalSupply)
      });
      
      // Update progress
      setMiningProgress(details.progress);
      
      // Check if prayed out
      if (Number(details.remainingSupply) <= 0) {
        setMiningStatus('prayed-out');
        setError(`All ${details.name} tokens have been prayed for! Praying is now closed.`);
      } else if (prayingStatus === 'prayed-out') {
        setMiningStatus('ready');
        setError(null);
      }
    } catch (err) {
      console.error("Error loading token details:", err);
      setError("Failed to load token data. Please try again later.");
      }
  }, [selectedToken, prayingStatus]);

  // Load user data
  const loadUserData = useCallback(async (address) => {
    if (!selectedToken) {
      // For Karma token, use existing functions
      try {
      const balance = await getBalance(address);
      const mined = await getMinerStats(address);
      
      setMinerStats({
        balance: Number(balance),
        mined: Number(mined)
      });
    } catch (err) {
        console.error("Error loading user Karma data:", err);
      }
      return;
    }

    try {
      const stats = await getUserTokenStats(address, selectedToken.address);
      setUserTokenStats(stats);
      
      setMinerStats({
        balance: Number(stats.balance),
        mined: Number(stats.mined)
      });
    } catch (err) {
      console.error("Error loading user token stats:", err);
    }
  }, [selectedToken]);
      
  // Subscribe to token events
  useEffect(() => {
    if (!isConnected || !selectedToken) {
      return;
    }

    try {
      const unsubscribe = subscribeToTokenEvents(selectedToken.address, {
        onPrayer: handlePrayingEvent,
        onExhausted: handlePrayingExhaustedEvent
      });
      
      setUnsubscribeTokenEvents(() => unsubscribe);
      
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (err) {
      console.error("Error subscribing to token events:", err);
    }
  }, [isConnected, selectedToken]);

  // Clean up token event subscriptions
  useEffect(() => {
    return () => {
      if (unsubscribeTokenEvents) {
        unsubscribeTokenEvents();
      }
    };
  }, [unsubscribeTokenEvents]);

  // Load data periodically
  useEffect(() => {
    const loadData = async () => {
      if (isConnected && account) {
        await loadUserData(account);
      }
      await loadTokenData();
    };
    
    loadData();
    const interval = setInterval(loadData, 30000);
    
    return () => clearInterval(interval);
  }, [isConnected, account, loadUserData, loadTokenData]);

  // Handle Prayer event from blockchain
  const handlePrayingEvent = (event) => {
    console.log('Pray event received:', event);
    
    // Update recent praying info
    setRecentMining(event);
    
    // Update stats if the current user prayed
    if (event.miner.toLowerCase() === account.toLowerCase()) {
      loadUserData(account);
    }
    
    // Update global stats
    loadTokenData();
  };

  // Handle PrayingExhausted event from blockchain
  const handlePrayingExhaustedEvent = (event) => {
    console.log('Pray exhausted event received:', event);
    
    // Update UI to show praying is exhausted
    setMiningStatus('prayed-out');
    
    // Show a message that praying is exhausted
    setError("All Karma tokens have been prayed for! Praying is now closed.");
    
    // Update global stats
    loadTokenData();
    
    // Add celebratory animation
    setShowMiningAnimation(true);
  };

  // Handle transaction status updates
  const handleTransactionUpdate = (update) => {
    console.log('Transaction update:', update);
    
    setTxStatus(update.status);
    
    // Store confirmations but we're not displaying them in the UI
    // We can use this for debugging with ESLint disabled
    // eslint-disable-next-line no-unused-vars
    setConfirmations(update.confirmations || 0);
    
    if (update.status === TX_STATUS.CONFIRMED) {
      // Transaction confirmed, update data
      loadUserData(account);
      loadTokenData();
      
      // Show praying success animation on confirmation
      setShowMiningAnimation(true);
      
      // Update praying status
      setMiningStatus('ready');
    } else if (update.status === TX_STATUS.FAILED) {
      // Transaction failed
      setError(update.error || "Transaction failed. Please try again.");
      setMiningStatus('ready');
    }
  };

  // Handle praying
  const handlePray = async () => {
    // Note: The 3-second delay already happens in the PrayerHands component
    // before this function is called
    
    // Set praying status to indicate we're working
    setMiningStatus('praying');
    setError(null);
    
    try {
      // Attempt to pray for the selected token or default to Karma
      const txHash = await (selectedToken 
        ? pray(selectedToken.address)
        : prayForKarma());
        
      console.log("Prayer transaction submitted:", txHash);
      
      // Update the UI to indicate prayer is in progress
      setMiningStatus('confirming');
      setTxHash(txHash);
      
      // Subscribe to transaction updates
      subscribeToTransaction(txHash, handleTransactionUpdate);
    } catch (error) {
      console.error("Prayer error:", error);
      
      // Check if it's a network-related error
      if (error.message && (
        error.message.includes('network') || 
        error.message.includes('chainId') || 
        error.message.includes('chain') ||
        error.message.toLowerCase().includes('network') ||
        error.code === 'NETWORK_ERROR'
      )) {
        setError("Please change to Somnia to proceed");
      } else {
        // Display other user-friendly error message
      setError(error.message || "Prayer failed. Please try again later.");
      }
      setMiningStatus('ready');
    }
  };

  // Get transaction status text
  const getStatusText = () => {
    if (!txStatus) return '';
    
    switch (txStatus) {
      case TX_STATUS.PENDING:
        return 'Transaction pending... Please wait for blockchain confirmation.';
      case TX_STATUS.CONFIRMED:
        return `Prayer successful! Transaction confirmed.`;
      case TX_STATUS.FAILED:
        return 'Transaction failed. Please try again.';
      default:
        return '';
    }
  };

  // Get transaction status class
  const getStatusClass = () => {
    if (!txStatus) return '';
    
    switch (txStatus) {
      case TX_STATUS.PENDING:
        return 'pending';
      case TX_STATUS.CONFIRMED:
        return 'confirmed';
      case TX_STATUS.FAILED:
        return 'failed';
      default:
        return '';
    }
  };

  // Handle animation completion
  const handleAnimationComplete = () => {
    setShowMiningAnimation(false);
  };

  // TESTING ONLY: Simulate prayed out state
  const simulatePrayedOut = () => {
    setMiningStatus('prayed-out');
    setError("TESTING: All Karma tokens have been prayed for! Praying is now closed.");
    
    // Update global stats to show all tokens prayed
    setGlobalStats(prev => ({
      ...prev,
      remainingSupply: 0,
      totalMined: prev.totalSupply
    }));
    
    // Update praying progress to 100%
    setMiningProgress(100);
    
    // Update prayer stats to show a realistic percentage
    setMinerStats(prev => ({
      ...prev,
      mined: 150000, // 150K KARMA, which is about 1.9% of total supply
      balance: 150000
    }));
  };

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    if (page === 'temp' && params) {
      setTokenParams(params);
    } else if (page === 'pray' && params.tokenAddress && params.tokenName) {
      setSelectedToken({
        name: params.tokenName,
        symbol: params.symbol || params.tokenName.split(' ')[0].toUpperCase(),
        tokensPerPrayer: params.tokensPerPrayer || 10000,
        address: params.tokenAddress
      });
      // Reset states when switching tokens
      setMiningStatus('ready');
      setError(null);
      setMiningProgress(0);
      setMinerStats({
        balance: 0,
        mined: 0
      });
      // Load new token's data
      if (isConnected) {
        loadUserData(account);
        loadTokenData();
      }
    } else if (page === 'pray') {
      // Reset to default token when navigating to pray without params
      setSelectedToken(null);
      // Reset states
      setMiningStatus('ready');
      setError(null);
      if (isConnected) {
        loadUserData(account);
        loadTokenData();
      }
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'deploy':
  return (
          <div className="page-container">
            <DeployToken onClose={() => handleNavigate('pray')} />
          </div>
        );
      case 'docs':
        return <Documentation onNavigate={handleNavigate} />;
      case 'temp':
        return <Temp {...tokenParams} />;
      default:
        return (
          <>
        <div className="game-container">
          <PrayerHands 
            status={prayingStatus} 
            onPray={handlePray} 
            isConnected={isConnected}
            isCorrectNetwork={isCorrectNetwork}
            onConnectWallet={() => document.querySelector('.connect-button')?.click()}
                token={selectedToken}
          />
          
          <div className="controls-container">
            {error && <div className="error-message">{error}</div>}
            
            {txHash && txStatus && (
              <div className={`tx-status ${getStatusClass()}`}>
                <div className="tx-status-text">{getStatusText()}</div>
                <a 
                  href={`${EXPLORER_URL}/tx/${txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  View transaction
                </a>
              </div>
            )}
            
            <ProgressBar 
              progress={prayProgress} 
              remaining={globalStats.remainingSupply}
              total={globalStats.totalSupply}
                  title={selectedToken ? selectedToken.name : 'Karma'}
            />
          </div>
          
          {isConnected && (
                <>
            <PrayerStats 
              balance={prayerStats.balance} 
              mined={prayerStats.mined}
              totalMined={globalStats.totalMined}
              totalSupply={globalStats.totalSupply}
            />
                  <AllocationStats />
                </>
          )}
          
          {showPrayAnimation && (
            <PrayingAnimation 
              onComplete={handleAnimationComplete} 
            />
          )}
            </div>
          </>
        );
    }
  };

  return (
    <div className="app">
      <BackgroundParticles />
      <header className="app-header">
        <div className="logo-container">
          <h1>pray.fun</h1>
          <span className="beta-badge">BETA</span>
        </div>
        
        <div className="nav-buttons">
          <button 
            className={`nav-button ${currentPage === 'pray' ? 'active' : ''}`} 
            onClick={() => handleNavigate('pray')}
          >
            Pray
          </button>
          <button 
            className={`nav-button ${currentPage === 'deploy' ? 'active' : ''}`}
            onClick={() => handleNavigate('deploy')}
          >
            Deploy
          </button>
          <button 
            className={`nav-button ${currentPage === 'docs' ? 'active' : ''}`}
            onClick={() => handleNavigate('docs')}
          >
            Documentation
          </button>
              <button 
            className={`nav-button ${currentPage === 'temp' ? 'active' : ''}`}
            onClick={() => handleNavigate('temp')}
              >
            Temp
              </button>
          <a 
            href="https://x.com/MetaDogeisme" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="nav-button twitter-button"
          >
            Twitter
          </a>
        </div>
        
        <WalletConnector isConnected={isConnected} account={account} onConnect={handleConnect} />
      </header>
      
      <main className="app-main">
        {renderContent()}
      </main>
      
      <footer className="app-footer">
        <div className="footer-content">
          <p>Built with ❤️ on the <a href="https://somnia.network" target="_blank" rel="noopener noreferrer">Somnia Network</a></p>
          <p>© 2025 pray.fun</p>
        </div>
      </footer>
    </div>
  );
}

export default App;