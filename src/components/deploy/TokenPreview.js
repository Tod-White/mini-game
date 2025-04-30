import React from 'react';
import './TokenPreview.css';

const TokenPreview = ({ name, symbol, totalSupply, burnAmount }) => {
  // Calculate prayers needed to mine all tokens (assuming 1000 tokens per prayer)
  const tokensPerPrayer = 1000;
  const prayersNeeded = Math.ceil(totalSupply / tokensPerPrayer);
  
  return (
    <div className="token-preview">
      <div className="token-preview-container">
        <div className="token-icon-container">
          <div className="token-icon">{symbol ? symbol.charAt(0) : '?'}</div>
          <div className="token-symbol">{symbol || 'SYM'}</div>
        </div>
        
        <div className="token-preview-details">
          <h3 className="token-name">{name || 'Token Name'}</h3>
          
          <div className="token-stats">
            <div className="token-stat">
              <span className="stat-label">Total Supply:</span>
              <span className="stat-value">{totalSupply.toLocaleString()} tokens</span>
            </div>
            <div className="token-stat">
              <span className="stat-label">Tokens per Prayer:</span>
              <span className="stat-value">{tokensPerPrayer.toLocaleString()} tokens</span>
            </div>
            <div className="token-stat">
              <span className="stat-label">Prayers to Mine All:</span>
              <span className="stat-value">{prayersNeeded.toLocaleString()} prayers</span>
            </div>
            <div className="token-stat">
              <span className="stat-label">Deployment Cost:</span>
              <span className="stat-value">{burnAmount.toLocaleString()} FAITH</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="token-preview-info">
        <p>
          <strong>Token Mechanics:</strong>
        </p>
        <ul>
          <li>Anyone can pray to mine {tokensPerPrayer} tokens per prayer</li>
          <li>Mining continues until all {totalSupply.toLocaleString()} tokens are mined</li>
          <li>All activity is tracked on the blockchain</li>
          <li>Users can transfer tokens freely</li>
        </ul>
      </div>
    </div>
  );
};

export default TokenPreview; 