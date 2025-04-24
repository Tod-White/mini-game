import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import PrayerHands from './components/PrayerHands';
import WalletConnector from './components/WalletConnector';
import ProgressBar from './components/ProgressBar';
import PrayerStats from './components/PrayerStats';
import PrayingAnimation from './components/PrayingAnimation';
import BackgroundParticles from './components/BackgroundParticles';
import AllocationStats from './components/AllocationStats';
import { 
  addNetworkSwitchListener, 
  getBalance, 
  getMinerStats, 
  getGlobalStats, 
  prayForKarma,
  subscribeToTransaction,
  unsubscribeFromTransaction,
  subscribeToEvent,
  unsubscribeFromEvent,
  TX_STATUS,
  EXPLORER_URL 
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
  // eslint-disable-next-line no-unused-vars
  const [confirmations, setConfirmations] = useState(0);
  const [error, setError] = useState(null);
  const [showPrayAnimation, setShowMiningAnimation] = useState(false);
  const [recentPray, setRecentMining] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [showDeployNotice, setShowDeployNotice] = useState(false);
  const [showDocNotice, setShowDocNotice] = useState(false);
  
  // Refs for dropdown containers
  const deployRef = useRef(null);
  const docRef = useRef(null);

  // Connect wallet handler
  const handleConnect = async (connectedAccount) => {
    setIsConnected(true);
    setAccount(connectedAccount);
    
    try {
      // Load user data
      await loadUserData(connectedAccount);
      
      // Load global stats
      await loadGlobalStats();
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

  // Set up blockchain event listeners
  useEffect(() => {
    if (isConnected) {
      // Listen for praying events (anyone on the network)
      subscribeToEvent('mining', handlePrayingEvent);
      
      // Listen for praying exhausted event
      subscribeToEvent('exhausted', handlePrayingExhaustedEvent);
    }
    
    return () => {
      // Clean up event listeners
      unsubscribeFromEvent('mining', handlePrayingEvent);
      unsubscribeFromEvent('exhausted', handlePrayingExhaustedEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, account]);

  // Clean up transaction subscription when component unmounts
  useEffect(() => {
    return () => {
      if (txHash) {
        unsubscribeFromTransaction(txHash);
      }
    };
  }, [txHash]);

  // Load user data from blockchain
  const loadUserData = async (address) => {
    try {
      // Get balance
      const balance = await getBalance(address);
      
      // Get prayer stats
      const mined = await getMinerStats(address);
      
      setMinerStats({
        balance: Number(balance),
        mined: Number(mined)
      });
    } catch (err) {
      console.error("Error loading user data:", err);
      throw err;
    }
  };

  // Load global stats from blockchain
  const loadGlobalStats = async () => {
    try {
      const stats = await getGlobalStats();
      
      setGlobalStats(stats);
      
      // Calculate praying progress
      const progress = stats.totalSupply > 0 
        ? (stats.totalMined / stats.totalSupply) * 100 
        : 0;
      
      // Ensure we set a valid progress value
      setMiningProgress(progress);
      
      // Check if all tokens are prayed
      if (stats.remainingSupply <= 0) {
        setMiningStatus('prayed-out');
        // Display a message that all tokens have been prayed for
        setError("All Karma tokens have been prayed for! Praying is now closed.");
      }
      
      console.log("Global stats loaded:", stats, "Progress:", progress.toFixed(2) + "%");
    } catch (err) {
      console.error("Error loading global stats:", err);
      throw err;
    }
  };

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
    loadGlobalStats();
  };

  // Handle PrayingExhausted event from blockchain
  const handlePrayingExhaustedEvent = (event) => {
    console.log('Pray exhausted event received:', event);
    
    // Update UI to show praying is exhausted
    setMiningStatus('prayed-out');
    
    // Show a message that praying is exhausted
    setError("All Karma tokens have been prayed for! Praying is now closed.");
    
    // Update global stats
    loadGlobalStats();
    
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
      loadGlobalStats();
      
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
      // Attempt to pray for karma
      const txHash = await prayForKarma();
      console.log("Prayer transaction submitted:", txHash);
      
      // Update the UI to indicate prayer is in progress
      setMiningStatus('confirming');
      setTxHash(txHash);
      
      // Subscribe to transaction updates
      subscribeToTransaction(txHash, handleTransactionUpdate);
      
      // We don't set showPrayAnimation here anymore
      // It will be set when the transaction is confirmed
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

  // Load global stats on initial load - update to make sure this runs first
  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        // Fetch global stats right away when the app loads
        console.log("Fetching initial global stats...");
        await loadGlobalStats();
      } catch (err) {
        console.error("Error loading global stats:", err);
      }
    };
    
    // Run immediately
    fetchGlobalStats();
    
    // Set up an interval to refresh global stats every 30 seconds
    const intervalId = setInterval(fetchGlobalStats, 30000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this runs once on mount

  // Handle clicks outside the dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (showDeployNotice && 
          deployRef.current && 
          !deployRef.current.contains(event.target)) {
        setShowDeployNotice(false);
      }
      
      if (showDocNotice && 
          docRef.current && 
          !docRef.current.contains(event.target)) {
        setShowDocNotice(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeployNotice, showDocNotice]);

  // Toggle deploy notice
  const toggleDeployNotice = () => {
    setShowDeployNotice(prev => !prev);
    setShowDocNotice(false);
  };

  // Toggle documentation notice
  const toggleDocNotice = () => {
    setShowDocNotice(prev => !prev);
    setShowDeployNotice(false);
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
          <button className="nav-button" onClick={() => window.location.reload()}>
            Pray
          </button>
          <div className="dropdown-container" ref={deployRef}>
            <button className="nav-button" onClick={toggleDeployNotice}>
              Deploy
            </button>
            {showDeployNotice && (
              <div className="dropdown-notice">
                Soon you can deploy your own pray token
              </div>
            )}
          </div>
          <div className="dropdown-container" ref={docRef}>
            <button className="nav-button" onClick={toggleDocNotice}>
              Documentation
            </button>
            {showDocNotice && (
              <div className="dropdown-notice">
                Coming soon
              </div>
            )}
          </div>
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
        <div className="game-container">
          <PrayerHands 
            status={prayingStatus} 
            onPray={handlePray} 
            isConnected={isConnected}
            isCorrectNetwork={isCorrectNetwork}
            onConnectWallet={() => document.querySelector('.connect-button')?.click()}
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
              title="Karma"
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
          
          {/* Mining success animation */}
          {showPrayAnimation && (
            <PrayingAnimation 
              onComplete={handleAnimationComplete} 
            />
          )}
          
          {/* Test button - disabled */}
          {/* 
          {process.env.NODE_ENV === 'development' && (
            <div className="test-controls">
              <button 
                onClick={simulatePrayedOut}
                className="test-button"
              >
                Test: Simulate all tokens prayed out
              </button>
            </div>
          )}
          */}
        </div>
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