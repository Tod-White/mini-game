import React, { useState, useRef, useEffect } from 'react';
import './PrayerHands.css';

const PrayerHands = ({ status, onPray, isConnected, onConnectWallet, isCorrectNetwork = true }) => {
  const [showPrayButton, setShowPrayButton] = useState(false);
  const [isPraying, setIsPraying] = useState(false);
  const [faithPoint, setFaithPoint] = useState(null);
  const [showingAnimation, setShowingAnimation] = useState(false);
  const [showNetworkMessage, setShowNetworkMessage] = useState(!isCorrectNetwork);
  const [isWrongNetworkVisible, setIsWrongNetworkVisible] = useState(false);
  
  const hasPrayedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const animationTimeoutRef = useRef(null);

  useEffect(() => {
    hasPrayedRef.current = false;
    isProcessingRef.current = false;
    setIsPraying(false);
    setShowingAnimation(false);
    
    if (status === 'ready') {
      setShowPrayButton(true);
    } else if (status === 'praying') {
      setIsPraying(true);
      setShowPrayButton(false);
    } else if (status === 'prayed') {
      hasPrayedRef.current = true;
      setShowPrayButton(false);
    } else {
      setShowPrayButton(false);
    }
  }, [status]);

  useEffect(() => {
    setShowNetworkMessage(!isCorrectNetwork);
  }, [isCorrectNetwork]);
  
  // Clear any existing animation timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);
  
  const createFaithPoint = () => {
    // Get a random position for the faith point from a focused area
    const centerX = 35; // Center X position
    const centerY = 50; // Center Y position
    
    // Random angle and radius for a circular distribution
    const angle = Math.random() * 2 * Math.PI;
    const radius = 80 + Math.random() * 40; // 80-120 radius range
    
    // Calculate X and Y positions
    const x = centerX + (radius * Math.cos(angle)) / 2.4;
    const y = centerY + (radius * Math.sin(angle)) / 2.4;
    
    // Random size (small or medium)
    const size = Math.random() < 0.5 ? 'small' : 'medium';
    
    // Create and return the faith point
    return {
      position: { 
        top: `${y}%`, 
        left: `${x}%` 
      },
      size,
      duration: 2000 + Math.random() * 1000 // 2-3 seconds animation duration
    };
  };

  const handlePrayButtonClick = (e) => {
    if (e) {
      e.stopPropagation();
    }

    if (!isConnected) {
      if (onConnectWallet) {
        onConnectWallet();
      }
      return;
    }
    
    if (isProcessingRef.current) {
      console.log("Already processing prayer request, ignoring duplicate clicks");
      return;
    }
    
    if (status === 'ready' && !isPraying && !hasPrayedRef.current && !showingAnimation) {
      isProcessingRef.current = true;
      
      // Create a single faith point for this prayer
      setFaithPoint(createFaithPoint());
      setShowingAnimation(true);
      
      // Clear any existing animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // Set timeout to hide the animation after 2-3 seconds
      animationTimeoutRef.current = setTimeout(() => {
        setShowingAnimation(false);
        setFaithPoint(null);
        isProcessingRef.current = false;
      }, 3000);
      
      // Call the pray function immediately - we don't need to wait for animation
      if (onPray) {
        onPray();
      }
    }
  };

  const handleImageClick = (e) => {
    if (e.currentTarget === e.target || e.target.tagName === 'IMG') {
      if (showPrayButton && status === 'ready' && !isPraying && !hasPrayedRef.current && !showingAnimation && !isProcessingRef.current) {
        handlePrayButtonClick();
      }
    }
  };

  const handleWrongNetworkClick = (e) => {
    e.stopPropagation();
  };
  
  const hideWrongNetwork = () => {
    const messageElement = document.querySelector('.wrong-network-message');
    if (messageElement) {
      messageElement.classList.add('hiding');
      setTimeout(() => {
        setIsWrongNetworkVisible(false);
      }, 500);
    }
  };

  const containerClassName = `prayer-container ${status} ${isConnected ? 'connected' : 'not-connected'}`;

  useEffect(() => {
    if (status === "Wrong network") {
      setIsWrongNetworkVisible(true);
    }
  }, [status]);

  return (
    <div className={containerClassName} onClick={hideWrongNetwork}>
      <div 
        className="prey-image-container" 
        onClick={handleImageClick}
        style={{ cursor: (status === 'ready' && !isPraying && showPrayButton && !hasPrayedRef.current && !showingAnimation && !isProcessingRef.current) ? 'pointer' : 'default' }}
      >
        <img 
          src="/image/Prey.png" 
          alt="Faith Prayer" 
          className={`prey-image ${status}`}
        />
        
        {showPrayButton && status === 'ready' && !isPraying && !hasPrayedRef.current && !showingAnimation && !isProcessingRef.current && (
          <button 
            className="pray-button-overlay"
            onClick={handlePrayButtonClick}
          >
            Pray
          </button>
        )}
        
        {status === 'prayed-out' && (
          <div className="pray-out-message">
            PRAY OUT
          </div>
        )}

        {!isConnected && (
          <div className="connect-wallet-message">
            Connect Wallet to Pray
          </div>
        )}

        {isConnected && showNetworkMessage && (
          <div className={`wrong-network-message ${isCorrectNetwork ? 'hiding' : ''}`} onClick={handleWrongNetworkClick}>
            Please change to Somnia to proceed
          </div>
        )}

        {isWrongNetworkVisible && (
          <div className="wrong-network-message" onClick={handleWrongNetworkClick}>
            Wrong Network! Please switch to Somnia
          </div>
        )}
      </div>
      
      {/* Single Faith+1 point animation */}
      {showingAnimation && faithPoint && (
        <div 
          className={`faith-point faith-point-${faithPoint.size}`}
          style={{
            top: faithPoint.position.top,
            left: faithPoint.position.left,
            animationDuration: `${faithPoint.duration}ms`
          }}
        >
          Faith+1
        </div>
      )}
    </div>
  );
};

export default PrayerHands;