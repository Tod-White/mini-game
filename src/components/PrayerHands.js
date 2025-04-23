import React, { useState, useRef, useEffect } from 'react';
import './PrayerHands.css';

const PrayerHands = ({ status, onPray, isConnected, onConnectWallet, isCorrectNetwork = true }) => {
  const [showPrayButton, setShowPrayButton] = useState(false);
  const [isPraying, setIsPraying] = useState(false);
  const [karmaPoints, setKarmaPoints] = useState([]);
  const [showingAnimation, setShowingAnimation] = useState(false);
  const [showNetworkMessage, setShowNetworkMessage] = useState(!isCorrectNetwork);
  const [isWrongNetworkVisible, setIsWrongNetworkVisible] = useState(false);
  
  const hasPrayedRef = useRef(false);
  const isProcessingRef = useRef(false);

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
  
  const createKarmaPoints = () => {
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
        duration: 2000 + Math.random() * 1000
      });
    });
    
    if (pointsCount > sectors.length) {
      const additionalPoints = pointsCount - sectors.length;
      
      for (let i = 0; i < additionalPoints; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = 90 + Math.random() * 70;
        
        const centerX = 35;
        
        const xOffset = -8 - Math.random() * 10;
        
        const x = centerX + (radius * Math.cos(angle)) / 2.4 + xOffset;
        const y = centerY + (radius * Math.sin(angle)) / 2.4;
        
        const delay = 800 + Math.random() * 500;
        
        const size = Math.random() < 0.5 ? 'small' : 'medium';
        
        points.push({
          id: sectors.length + i,
          position: { 
            top: `${y}%`, 
            left: `${x}%` 
          },
          delay,
          size,
          duration: 2000 + Math.random() * 1000
        });
      }
    }
    
    return points;
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
      
      setShowingAnimation(true);
      setKarmaPoints(createKarmaPoints());
      
      setTimeout(() => {
        hasPrayedRef.current = true;
        setIsPraying(true);
        
        if (onPray && isProcessingRef.current) {
          onPray();
        }
      }, 3000);
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
          alt="Karma Prey" 
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
      
      {showingAnimation && karmaPoints.map(point => (
        <div 
          key={point.id}
          className={`karma-point karma-point-${point.size}`}
          style={{
            top: point.position.top,
            left: point.position.left,
            animationDelay: `${point.delay}ms`,
            animationDuration: `${point.duration}ms`
          }}
        >
          Karma+1
        </div>
      ))}
    </div>
  );
};

export default PrayerHands;