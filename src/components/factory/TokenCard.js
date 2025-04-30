import React, { useState, useEffect } from 'react';
import './TokenCard.css';
import { getPrayerTokenDetails, prayForToken, EXPLORER_URL } from '../../utils/blockchain';

const TokenCard = ({ token, isUserCreator }) => {
  const [tokenDetails, setTokenDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [praying, setPraying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Load token details on mount
  useEffect(() => {
    const loadTokenDetails = async () => {
      try {
        const details = await getPrayerTokenDetails(token.tokenAddress);
        setTokenDetails(details);
      } catch (error) {
        console.error(`Error loading details for token ${token.tokenAddress}:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTokenDetails();
  }, [token.tokenAddress]);
  
  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format address for display
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Handle pray action
  const handlePray = async () => {
    if (praying || !tokenDetails || parseFloat(tokenDetails.remainingSupply) <= 0) return;
    
    setPraying(true);
    
    try {
      // Call the mine function on the token contract
      await prayForToken(token.tokenAddress);
      
      // Refresh token details after praying
      const details = await getPrayerTokenDetails(token.tokenAddress);
      setTokenDetails(details);
    } catch (error) {
      console.error(`Error praying for token ${token.tokenAddress}:`, error);
    } finally {
      setPraying(false);
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  return (
    <div className={`token-card ${expanded ? 'expanded' : ''}`}>
      <div className="token-card-header">
        <div 
          className="token-card-icon" 
          style={{ 
            background: `linear-gradient(135deg, #FFB6C1, ${token.name.length % 2 === 0 ? '#B19CD9' : '#9A67EA'})`,
            boxShadow: '0 0 10px rgba(255, 182, 193, 0.4)'
          }}
        >
          {token.symbol.charAt(0)}
        </div>
        <div className="token-card-title">
          <div className="name-symbol-container">
            <h3>{token.name}</h3>
            <div className="token-card-symbol">{token.symbol}</div>
          </div>
        </div>
        {isUserCreator && (
          <div className="creator-badge">
            Creator
          </div>
        )}
      </div>
      
      <div className="token-card-content">
        <div className="token-card-info">
          <div className="token-info-item">
            <span className="info-label">Total Supply</span>
            <span className="info-value">{parseFloat(token.totalSupply).toLocaleString()}</span>
          </div>
          <div className="token-info-item">
            <span className="info-label">Creator</span>
            <a 
              href={`${EXPLORER_URL}/address/${token.creator}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="address-link"
            >
              {formatAddress(token.creator)}
            </a>
          </div>
          <div className="token-info-item">
            <span className="info-label">Deployed</span>
            <span className="info-value">{formatDate(token.timestamp)}</span>
          </div>
        </div>
        
        {loading ? (
          <div className="token-details-loading">
            <div className="mini-loader"></div>
            <span>Loading details...</span>
          </div>
        ) : tokenDetails ? (
          <div className="token-details">
            <div className="token-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${tokenDetails.progress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                <span>{(tokenDetails.progress || 0).toFixed(1)}% Mined</span>
                <span>
                  {parseFloat(tokenDetails.totalMined).toLocaleString()} / 
                  {parseFloat(tokenDetails.totalSupply).toLocaleString()}
                </span>
              </div>
            </div>
            
            <button 
              className="pray-button"
              onClick={handlePray}
              disabled={praying || parseFloat(tokenDetails.remainingSupply) <= 0}
            >
              {praying 
                ? "Praying..."
                : parseFloat(tokenDetails.remainingSupply) <= 0
                  ? "Fully Mined"
                  : "Pray to Mine"
              }
            </button>
          </div>
        ) : (
          <div className="token-details-error">
            <span>Error loading token details</span>
          </div>
        )}
      </div>
      
      <div className="token-card-footer">
        <button className="expand-button" onClick={toggleExpanded}>
          {expanded ? "Show Less" : "Show More"}
        </button>
        
        <a 
          href={`${EXPLORER_URL}/address/${token.tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="explorer-link"
        >
          View on Explorer
        </a>
      </div>
      
      {expanded && (
        <div className="token-card-expanded">
          <div className="expanded-info">
            <div className="expanded-item">
              <span className="expanded-label">Token Address</span>
              <a 
                href={`${EXPLORER_URL}/address/${token.tokenAddress}`} 
                target="_blank"
                rel="noopener noreferrer"
                className="address-link"
              >
                {token.tokenAddress}
              </a>
            </div>
            
            {tokenDetails && (
              <>
                <div className="expanded-item">
                  <span className="expanded-label">Tokens per Prayer</span>
                  <span className="expanded-value">{parseFloat(tokenDetails.tokensPerMine).toLocaleString()}</span>
                </div>
                <div className="expanded-item">
                  <span className="expanded-label">Remaining Supply</span>
                  <span className="expanded-value">{parseFloat(tokenDetails.remainingSupply).toLocaleString()}</span>
                </div>
                <div className="expanded-item">
                  <span className="expanded-label">Prayers completed</span>
                  <span className="expanded-value">
                    {Math.floor(parseFloat(tokenDetails.totalMined) / parseFloat(tokenDetails.tokensPerMine)).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenCard; 