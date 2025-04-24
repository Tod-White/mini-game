import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import PrayerHands from './components/PrayerHands';
import WalletConnector from './components/WalletConnector';
import ProgressBar from './components/ProgressBar';
import PrayerStats from './components/PrayerStats';
import PrayingAnimation from './components/PrayingAnimation';
import BackgroundParticles from './components/BackgroundParticles';
import { EtherbaseProvider } from './utils/etherbaseClient';
import { 
  addNetworkSwitchListener, 
  getUserStats, 
  getGlobalStats, 
  prayForFaith,
  subscribeToBatchProcessing,
  TX_STATUS,
  EXPLORER_URL,
  initBlockchain
} from './utils/blockchain';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [prayingStatus, setPrayingStatus] = useState('ready'); // ready, praying, prayed-out
  const [prayProgress, setPrayProgress] = useState(0); // 0-100
  const [prayerStats, setPrayerStats] = useState({
    confirmedPrayers: 0,
    pendingPrayers: 0,
    totalPrayers: 0,
    balance: 0,
  });
  const [globalStats, setGlobalStats] = useState({
    totalMined: 0,
    totalSupply: 666666666,
    remainingSupply: 666666666,
    pendingPrayers: 0,
    processedPrayers: 0,
    batches: 0
  });
  const [txHash, setTxHash] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [error, setError] = useState(null);
  const [showPrayAnimation, setShowPrayAnimation] = useState(false);
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
      // Initialize blockchain and Etherbase
      await initBlockchain();
      
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
      // Listen for batch processing events
      subscribeToBatchProcessing(handleBatchProcessed);
    }
    
    // No cleanup needed as subscribeToBatchProcessing handles this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, account]);

  // Handle batch processing event
  const handleBatchProcessed = (event) => {
    console.log('Batch processed event received:', event);
    
    // Update stats for the current user
    loadUserData(account);
    
    // Update global stats
    loadGlobalStats();
  };

  // Load user data
  const loadUserData = async (address) => {
    try {
      // Get combined stats (confirmed and pending)
      const stats = await getUserStats(address);
      
      setPrayerStats({
        confirmedPrayers: stats.confirmedPrayers,
        pendingPrayers: stats.pendingPrayers,
        totalPrayers: stats.totalPrayers,
        balance: stats.balance
      });
    } catch (err) {
      console.error("Error loading user data:", err);
      throw err;
    }
  };

  // Load global stats
  const loadGlobalStats = async () => {
    try {
      const stats = await getGlobalStats();
      
      setGlobalStats(stats);
      
      // Calculate praying progress
      const progress = stats.totalSupply > 0 
        ? ((stats.totalMined + stats.pendingPrayers) / stats.totalSupply) * 100 
        : 0;
      
      // Ensure we set a valid progress value
      setPrayProgress(progress);
      
      // Check if all tokens are prayed
      if (stats.remainingSupply <= 0) {
        setPrayingStatus('prayed-out');
        // Display a message that all tokens have been prayed for
        setError("All Faith tokens have been prayed for! Praying is now closed.");
      }
      
      console.log("Global stats loaded:", stats, "Progress:", progress.toFixed(2) + "%");
    } catch (err) {
      console.error("Error loading global stats:", err);
      throw err;
    }
  };

  // Handle prayer
  const handlePray = async () => {
    // Set praying status to indicate we're working
    setPrayingStatus('praying');
    setError(null);
    
    try {
      // Attempt to pray for Faith
      const result = await prayForFaith();
      console.log("Prayer submitted:", result);
      
      // Prayer is recorded in Etherbase, no transaction to wait for
      // Update the UI to show prayer is complete
      setPrayingStatus('ready');
      
      // Update user data to show pending prayer
      await loadUserData(account);
      
      // Update global stats
      await loadGlobalStats();
      
      // Show prayer success animation
      setShowPrayAnimation(true);
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
      setPrayingStatus('ready');
    }
  };

  // Get transaction status text - for backward compatibility
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

  // Get transaction status class - for backward compatibility
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
    setShowPrayAnimation(false);
  };

  // Load global stats on initial load
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
    <EtherbaseProvider config={{}}>
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
                title="Faith"
              />
            </div>
            
            {isConnected && (
              <PrayerStats 
                confirmed={prayerStats.confirmedPrayers}
                pending={prayerStats.pendingPrayers}
                total={prayerStats.totalPrayers}
                balance={prayerStats.balance}
                totalMined={globalStats.totalMined}
                pendingPrayers={globalStats.pendingPrayers}
                totalSupply={globalStats.totalSupply}
              />
            )}
            
            {/* Prayer success animation */}
            {showPrayAnimation && (
              <PrayingAnimation 
                onComplete={handleAnimationComplete} 
              />
            )}
          </div>
        </main>
        
        <footer className="app-footer">
          <div className="footer-content">
            <p>Built with ❤️ on the <a href="https://somnia.network" target="_blank" rel="noopener noreferrer">Somnia Network</a></p>
            <p>© 2025 pray.fun | <a href="https://shannon-explorer.somnia.network/address/0xE40e64F71B280e1f9b2Fd61d38d3D0f1beaBd259" target="_blank" rel="noopener noreferrer">Contract</a></p>
          </div>
        </footer>
      </div>
    </EtherbaseProvider>
  );
}

export default App;