import React, { useState, useEffect } from 'react';
import './Temp.css';
import PrayerHands from './PrayerHands';
import ProgressBar from './ProgressBar';
import PrayerStats from './PrayerStats';
import PrayingAnimation from './PrayingAnimation';
import AllocationStats from './AllocationStats';
import { EXPLORER_URL, initBlockchain, addNetworkSwitchListener } from '../utils/blockchain';

function Temp({ 
  tokenAddress, 
  tokenName, 
  symbol, 
  tokensPerPrayer,
  remainingSupply = 0,
  totalSupply = 0,
  currentProgress = 0
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [minerStats, setMinerStats] = useState({
    balance: 0,
    mined: 0
  });
  
  const [globalStats, setGlobalStats] = useState({
    totalMined: Math.max(0, Number(totalSupply) - Number(remainingSupply)),
    remainingSupply: Number(remainingSupply),
    totalSupply: Number(totalSupply)
  });
  
  const [miningProgress, setMiningProgress] = useState(Number(currentProgress) || 0);
  const [miningStatus, setMiningStatus] = useState('ready');
  const [error, setError] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [showMiningAnimation, setShowMiningAnimation] = useState(false);

  // Handle wallet connection and network changes
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const result = await initBlockchain();
            setIsConnected(true);
            setIsCorrectNetwork(result.isCorrectNetwork);
            setIsTestMode(result.isCorrectNetwork); // Set test mode based on network
          } else {
            setIsConnected(false);
            setIsTestMode(false);
          }
        } catch (error) {
          console.error("Error checking connection:", error);
          setIsConnected(false);
          setIsTestMode(false);
        }
      }
    };

    // Initial check
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          const result = await initBlockchain();
          setIsConnected(true);
          setIsCorrectNetwork(result.isCorrectNetwork);
          setIsTestMode(result.isCorrectNetwork);
        } else {
          setIsConnected(false);
          setIsTestMode(false);
          setIsCorrectNetwork(false);
        }
      });

      // Listen for network changes
      addNetworkSwitchListener((isCorrect) => {
        setIsCorrectNetwork(isCorrect);
        setIsTestMode(isCorrect);
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  // Handle connect wallet button click
  const handleConnectWallet = async () => {
    try {
      const result = await initBlockchain();
      setIsConnected(true);
      setIsCorrectNetwork(result.isCorrectNetwork);
      setIsTestMode(result.isCorrectNetwork);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Failed to connect wallet");
    }
  };

  const handlePray = async () => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!isCorrectNetwork) {
      setError("Please switch to the correct network");
      return;
    }

    if (miningStatus === 'praying') {
      setError("Already praying");
      return;
    }

    if (miningStatus === 'prayed-out') {
      setError("All tokens have been prayed for");
      return;
    }

    setMiningStatus('praying');
    setError(null);

    // Simulate praying delay
    setTimeout(() => {
      setMiningStatus('ready');
      const prayAmount = tokensPerPrayer || 10000;
      
      setMinerStats(prev => ({
        ...prev,
        balance: prev.balance + prayAmount,
        mined: prev.mined + prayAmount
      }));
      
      setGlobalStats(prev => {
        const newTotalMined = prev.totalMined + prayAmount;
        const newProgress = (newTotalMined / prev.totalSupply) * 100;
        setMiningProgress(Math.min(100, newProgress));
        
        return {
          ...prev,
          totalMined: newTotalMined,
          remainingSupply: Math.max(0, prev.remainingSupply - prayAmount)
        };
      });
      
      setShowMiningAnimation(true);
      setTimeout(() => setShowMiningAnimation(false), 3000);
    }, 2000);
  };

  const handleAnimationComplete = () => {
    setShowMiningAnimation(false);
  };

  return (
    <div className="game-container">
      <div className="test-header">
        <button 
          className={`test-mode-button ${isTestMode ? 'active' : ''}`}
          disabled={!isConnected || !isCorrectNetwork}
        >
          Test Mode: {isTestMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <PrayerHands 
        status={miningStatus} 
        onPray={handlePray} 
        isConnected={isConnected}
        isCorrectNetwork={isCorrectNetwork}
        onConnectWallet={handleConnectWallet}
        token={tokenAddress ? {
          name: tokenName || '',
          symbol: symbol || '',
          tokensPerPrayer: Number(tokensPerPrayer) || 0,
          address: tokenAddress
        } : null}
      />
      
      <div className="controls-container">
        {error && <div className="error-message">{error}</div>}
        
        <ProgressBar 
          progress={Number(miningProgress) || 0}
          remaining={Number(globalStats.remainingSupply) || 0}
          total={Number(globalStats.totalSupply) || 0}
          title={tokenName || "Token"}
        />
      </div>
      
      {isConnected && isCorrectNetwork && (
        <>
          <PrayerStats 
            balance={Number(minerStats.balance) || 0}
            mined={Number(minerStats.mined) || 0}
            totalMined={Number(globalStats.totalMined) || 0}
            totalSupply={Number(globalStats.totalSupply) || 0}
          />
          <a 
            href={`${EXPLORER_URL}/token/${tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            View all token holders on Shannon Explorer
          </a>
          <AllocationStats />
        </>
      )}
      
      {showMiningAnimation && (
        <PrayingAnimation 
          onComplete={handleAnimationComplete} 
        />
      )}
    </div>
  );
}

export default Temp; 