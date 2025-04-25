import React, { useState, useEffect, useCallback } from 'react';
import { pray, canPray, getPrayerCooldown } from '../utils/blockchain';
import './PrayerHands.css';

// Default token configuration
const DEFAULT_TOKEN = {
  address: null,  // Will default to CONTRACT_ADDRESS in blockchain.js
  name: 'Karma',
  symbol: 'KARMA',
  tokensPerPrayer: 7
};

const PrayerHands = ({ 
  token = null, 
  onPrayerComplete,
  status = 'ready', // ready, praying, prayed-out
  isConnected = false,
  onConnectWallet,
  isCorrectNetwork = true
}) => {
  // Only merge with defaults if token is provided and has an address
  const currentToken = token && token.address ? { ...DEFAULT_TOKEN, ...token } : DEFAULT_TOKEN;
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [points, setPoints] = useState([]);
  const [canPrayNow, setCanPrayNow] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [showPrayButton, setShowPrayButton] = useState(true);

  // Function to create floating points
  const createPoints = useCallback(() => {
    const pointsCount = 10;
    const points = [];
    
    const sectors = [
      { angle: -120, radius: 110 },
      { angle: -90, radius: 100 },
      { angle: -60, radius: 110 },
      { angle: -150, radius: 100 },
      { angle: -30, radius: 100 },
      { angle: -170, radius: 110 },
      { angle: 170, radius: 100 },
      { angle: 150, radius: 110 },
    ];
    
    const centerX = 35;
    const centerY = 50;
    
    sectors.forEach((sector, index) => {
      const radians = (sector.angle * Math.PI) / 180;
      
      const x = centerX + (sector.radius * Math.cos(radians)) / 2.4;
      const y = centerY + (sector.radius * Math.sin(radians)) / 2.4;
      
      const delay = index * 100 + Math.random() * 300;
      
      const size = Math.random() < 0.5 ? 'small' : 'medium';
      
      points.push({
        id: index,
        position: { 
          top: `${y}%`, 
          left: `${x}%` 
        },
        delay,
        size,
        duration: 2000 + Math.random() * 1000,
        text: `${currentToken.symbol}+1`
      });
    });
    
    setPoints(points);
    setTimeout(() => {
      setPoints([]);
    }, 3000);
  }, [currentToken.symbol]);

  // Check if user can pray
  const checkCanPray = useCallback(async () => {
    try {
      if (window.ethereum && isConnected && isCorrectNetwork) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts[0]) {
          const canPrayNow = await canPray(accounts[0], currentToken.address);
          setCanPrayNow(canPrayNow);
          setShowPrayButton(canPrayNow && status === 'ready');
          if (!canPrayNow) {
            const remainingCooldown = await getPrayerCooldown(accounts[0], currentToken.address);
            setCooldown(remainingCooldown);
          }
        }
      }
    } catch (err) {
      console.error('Error checking prayer status:', err);
    }
  }, [currentToken.address, isConnected, isCorrectNetwork, status]);

  // Effect to check prayer status periodically
  useEffect(() => {
    checkCanPray();
    const interval = setInterval(checkCanPray, 1000);
    return () => clearInterval(interval);
  }, [checkCanPray]);

  // Handle prayer
  const handlePray = async (e) => {
    if (e) {
      e.stopPropagation();
    }

    if (!isConnected) {
      if (onConnectWallet) {
        onConnectWallet();
      }
      return;
    }
    
    if (!canPrayNow || status !== 'ready') return;
    
    try {
      setError('');
      setIsAnimating(true);
      setShowPrayButton(false);
      createPoints();
      
      const result = await pray(currentToken.address);
      
      if (result.success) {
        if (onPrayerComplete) {
          onPrayerComplete(result.hash);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to pray. Please try again.');
      console.error('Prayer error:', err);
      setShowPrayButton(true);
    } finally {
      setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
    }
  };

  // Format cooldown time
  const formatCooldown = (seconds) => {
    if (seconds <= 0) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const containerClassName = `prayer-container ${status} ${isConnected ? 'connected' : 'not-connected'}`;

  return (
    <div className={containerClassName}>
      {error && <div className="error-message">{error}</div>}
      
      <div 
        className="prey-image-container" 
        onClick={handlePray}
        style={{ cursor: (showPrayButton && isConnected) ? 'pointer' : 'default' }}
      >
        <img 
          src="/image/Prey.png" 
          alt={`${currentToken.name} Prayer`}
          className="prey-image"
        />
        
        {points.map(point => (
          <div
            key={point.id}
            className={`karma-point karma-point-${point.size}`}
            style={{
              ...point.position,
              animationDelay: `${point.delay}ms`,
              animationDuration: `${point.duration}ms`
            }}
          >
            {point.text}
          </div>
        ))}
        
        {showPrayButton && status === 'ready' && isConnected && isCorrectNetwork && (
          <button 
            className="pray-button-overlay"
            onClick={handlePray}
          >
            Pray
          </button>
        )}

        {!isConnected && (
          <div className="connect-wallet-message">
            Connect Wallet to Pray
          </div>
        )}

        {isConnected && !isCorrectNetwork && (
          <div className="wrong-network-message">
            Please change to Somnia to proceed
          </div>
        )}

        {!canPrayNow && cooldown > 0 && (
          <div className="pray-out-message">Next prayer in: {formatCooldown(cooldown)}</div>
        )}

        {status === 'prayed-out' && (
          <div className="pray-out-message">
            PRAY OUT
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerHands;