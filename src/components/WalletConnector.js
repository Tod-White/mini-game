/* global BigInt */
import React, { useState, useEffect } from 'react';
import './WalletConnector.css';
import { 
  isMetaMaskInstalled, 
  initBlockchain,
  switchToSomniaNetwork,
  addNetworkSwitchListener,
  SOMNIA_CHAIN_ID
} from '../utils/blockchain';
import { ethers } from 'ethers';

const WalletConnector = ({ isConnected, account, onConnect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  const [showDisconnectPrompt, setShowDisconnectPrompt] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [networkIndicator, setNetworkIndicator] = useState('Somnia');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  
  const handleConnect = async () => {
    if (isConnected) return;
    setIsLoading(true);
    setNetworkError(null);
    
    try {
      // Check if MetaMask is installed
      if (!isMetaMaskInstalled()) {
        setNetworkError('MetaMask not detected. Please install MetaMask extension.');
        setIsLoading(false);
        return;
      }
      
      // Check network first
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      const correctNetwork = Number(network.chainId) === Number(SOMNIA_CHAIN_ID);
      console.log("[WalletConnector] Wallet chainId:", network.chainId, "Expected:", SOMNIA_CHAIN_ID, "Correct:", correctNetwork);
      
      // Update network indicator immediately
      setIsCorrectNetwork(correctNetwork);
      setNetworkIndicator(correctNetwork ? 'Somnia' : 'Wrong Network');
      
      // Initialize blockchain connection
      const { account, isCorrectNetwork: connectedNetworkCorrect } = await initBlockchain();
      
      // If we're on the correct network, connect
      if (connectedNetworkCorrect) {
        onConnect(account);
      } else {
        // Try to switch networks
        await switchToSomniaNetwork();
      }
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      setNetworkError(error.message || 'Failed to connect wallet');
      setIsLoading(false);
    }
  };
  
  const handleDisconnect = () => {
    window.location.reload(); // Simple disconnect by reloading the page
  };
  
  const handleLogoutClick = () => {
    setShowDisconnectPrompt(!showDisconnectPrompt);
  };
  
  const formatAccount = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Check network on mount and set indicator
  useEffect(() => {
    console.log("Setting up network listeners in WalletConnector");
    
    // Add network switch listener
    addNetworkSwitchListener((correctNetwork) => {
      console.log("Network switch listener callback, correct network:", correctNetwork);
      setIsCorrectNetwork(correctNetwork);
      setNetworkIndicator(correctNetwork ? 'Somnia' : 'Wrong Network');
    });
    
    // Check initial network
    const checkNetwork = async () => {
      if (!isMetaMaskInstalled()) {
        console.log("MetaMask not installed");
        return;
      }
      
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        const correctNetwork = Number(network.chainId) === Number(SOMNIA_CHAIN_ID);
        console.log("[WalletConnector] Wallet chainId:", network.chainId, "Expected:", SOMNIA_CHAIN_ID, "Correct:", correctNetwork);
        
        console.log("Initial network check, chain ID:", network.chainId, "correct:", correctNetwork);
        
        setIsCorrectNetwork(correctNetwork);
        setNetworkIndicator(correctNetwork ? 'Somnia' : 'Wrong Network');
      } catch (error) {
        console.error("Network check error:", error);
        setIsCorrectNetwork(false);
        setNetworkIndicator('Wrong Network');
      }
    };
    
    checkNetwork();
    
    // Additional direct listener for chain changes
    if (window.ethereum) {
      const handleDirectChainChange = (chainIdHex) => {
        try {
          const chainId = parseInt(chainIdHex, 16);
          console.log("[WalletConnector] Direct chain change, chainId:", chainId, "Expected:", SOMNIA_CHAIN_ID, "Correct:", Number(chainId) === Number(SOMNIA_CHAIN_ID));
          const correctNetwork = Number(chainId) === Number(SOMNIA_CHAIN_ID);
          
          // Update UI immediately
          setIsCorrectNetwork(correctNetwork);
          setNetworkIndicator(correctNetwork ? 'Somnia' : 'Wrong Network');
          
          // If network is correct, try to reconnect
          if (correctNetwork) {
            (async () => {
              try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                  onConnect(accounts[0]);
                }
              } catch (err) {
                console.error("Error reconnecting after network switch:", err);
              }
            })();
          }
        } catch (error) {
          console.error("Error handling chain change:", error);
        }
      };
      
      window.ethereum.on('chainChanged', handleDirectChainChange);
      
      return () => {
        window.ethereum.removeListener('chainChanged', handleDirectChainChange);
      };
    }
  }, [onConnect]);
  
  // Handle network button click
  const handleNetworkClick = async () => {
    if (!isCorrectNetwork) {
      try {
        await switchToSomniaNetwork();
        
        // Check if network was successfully changed
        setTimeout(async () => {
          if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            const correctNetwork = Number(network.chainId) === Number(SOMNIA_CHAIN_ID);
            console.log("[WalletConnector] Wallet chainId:", network.chainId, "Expected:", SOMNIA_CHAIN_ID, "Correct:", correctNetwork);
            
            setIsCorrectNetwork(correctNetwork);
            setNetworkIndicator(correctNetwork ? 'Somnia' : 'Wrong Network');
            
            // If network is correct and we have the account, reconnect
            if (correctNetwork) {
              try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                  onConnect(accounts[0]);
                }
              } catch (err) {
                console.error("Error getting accounts after network switch:", err);
              }
            }
          }
        }, 1000); // Short delay to ensure MetaMask has updated
      } catch (error) {
        console.error("Network switch error:", error);
      }
    }
  };
  
  return (
    <div className="wallet-connector">
      {isConnected ? (
        <div className="wallet-info">
          <div className="wallet-address-container">
            <div className="wallet-address">
              {formatAccount(account)}
            </div>
            <button 
              className="logout-button" 
              onClick={handleLogoutClick}
              title="Logout"
            >
              Logout
            </button>
            {showDisconnectPrompt && (
              <div className="disconnect-prompt">
                <div style={{ marginBottom: '8px', fontSize: '0.85rem', textAlign: 'center', color: '#fff' }}>
                  Are you sure you want to disconnect?
                </div>
                <button onClick={handleDisconnect}>Disconnect Wallet</button>
              </div>
            )}
          </div>
          <div 
            className={`wallet-network ${!isCorrectNetwork ? 'wrong-network' : ''}`}
            onClick={handleNetworkClick}
          >
            <span className={`network-indicator ${!isCorrectNetwork ? 'wrong-network' : ''}`}></span>
            {networkIndicator}
          </div>
        </div>
      ) : (
        <div className="connect-container">
          <button 
            className={`connect-button ${isLoading ? 'loading' : ''}`} 
            onClick={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
          
          {networkError && (
            <div className="network-error">
              {networkError}
            </div>
          )}
          
          {!isCorrectNetwork && (
            <div 
              className="wallet-network wrong-network"
              onClick={handleNetworkClick}
            >
              <span className="network-indicator wrong-network"></span>
              Wrong Network
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletConnector; 