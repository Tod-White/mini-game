import React, { useState, useEffect } from 'react';
import './Documentation.css';
import { getDeployedTokens, EXPLORER_URL } from '../utils/blockchain';

function Documentation({ onNavigate }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        const deployedTokens = await getDeployedTokens();
        setTokens(deployedTokens);
        setError(null);
      } catch (err) {
        console.error("Error loading deployed tokens:", err);
        setError("Failed to load tokens. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
    // Refresh every 1 minute
    const intervalId = setInterval(fetchTokens, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Calculate progress for token
  const calculateProgress = (total, remaining) => {
    if (!total || !remaining) return 0;
    const totalNum = parseFloat(total);
    const remainingNum = parseFloat(remaining);
    return ((totalNum - remainingNum) / totalNum) * 100;
  };

  const handlePrayClick = (token) => {
    try {
      // Pass token information directly from the Documentation list
      onNavigate('temp', { 
        tokenAddress: token.address,
        tokenName: token.name,
        symbol: token.symbol,
        tokensPerPrayer: token.tokensPerPrayer,
        remainingSupply: token.remainingSupply,
        totalSupply: token.totalSupply,
        currentProgress: calculateProgress(token.totalSupply, token.remainingSupply)
      });
    } catch (error) {
      console.error("Error navigating to token:", error);
      setError("Failed to load token details. Please try again.");
    }
  };

  const SimpleProgressBar = ({ progress }) => (
    <div className="simple-progress-container">
      <div className="simple-progress-bar">
        <div 
          className="simple-progress-fill"
          style={{ width: `${progress}%` }}
        />
        <div className="progress-text">Progress: {progress.toFixed(2)}%</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="documentation-container">
        <h2>Deployed Tokens</h2>
        <div className="loading">Loading tokens...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="documentation-container">
        <h2>Deployed Tokens</h2>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="documentation-container">
      <h2>Deployed Tokens</h2>
      <div className="tokens-container">
        <div className="tokens-header">
          <div className="header-cell">Name</div>
          <div className="header-cell">Total Supply</div>
          <div className="header-cell">Prayers</div>
          <div className="header-cell">Progress</div>
          <div className="header-cell">Date</div>
          <div className="header-cell">Action</div>
        </div>
        <div className="tokens-list">
          {tokens.length === 0 ? (
            <div className="no-tokens">No tokens have been deployed yet.</div>
          ) : (
            tokens.map((token) => (
              <div 
                key={token.address} 
                className="token-card"
              >
                <div className="token-content">
                  <div className="token-cell">
                    <a 
                      href={`${EXPLORER_URL}/token/${token.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="token-link"
                    >
                      {token.name}
                    </a>
                  </div>
                  <div className="token-cell">{parseFloat(token.totalSupply).toLocaleString()}</div>
                  <div className="token-cell">{parseFloat(token.tokensPerPrayer).toLocaleString()}/prayer</div>
                  <div className="token-cell progress-cell">
                    <SimpleProgressBar 
                      progress={calculateProgress(
                        token.totalSupply,
                        token.remainingSupply
                      )}
                    />
                  </div>
                  <div className="token-cell">{token.deployedDate}</div>
                  <div className="token-cell">
                    <button 
                      className="pray-button"
                      onClick={() => handlePrayClick(token)}
                    >
                      Pray
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Documentation; 