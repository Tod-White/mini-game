import React, { useState } from 'react';
import './DeployToken.css';
import { deployToken } from '../utils/blockchain';

function DeployToken({ onClose }) {
  const [tokenInfo, setTokenInfo] = useState({
    name: '',
    symbol: '',
    totalSupply: ''
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState('');
  const [deploySuccess, setDeploySuccess] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTokenInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateInputs = () => {
    if (!tokenInfo.name || !tokenInfo.symbol) {
      throw new Error('Token name and symbol are required');
    }

    if (!tokenInfo.totalSupply || isNaN(tokenInfo.totalSupply) || tokenInfo.totalSupply <= 0) {
      throw new Error('Total supply must be a positive number');
    }

    // Check if symbol is valid (3-5 uppercase letters)
    const symbolRegex = /^[A-Z]{3,5}$/;
    if (!symbolRegex.test(tokenInfo.symbol)) {
      throw new Error('Symbol must be 3-5 uppercase letters');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDeployError('');
    setDeploySuccess(null);
    
    try {
      validateInputs();
      setIsDeploying(true);

      const tokenAddress = await deployToken(
        tokenInfo.name,
        tokenInfo.symbol,
        tokenInfo.totalSupply
      );

      if (tokenAddress) {
        setDeploySuccess({
          address: tokenAddress
        });

        // Reset form
        setTokenInfo({
          name: '',
          symbol: '',
          totalSupply: ''
        });
      } else {
        throw new Error('Failed to deploy token - no address returned');
      }

    } catch (error) {
      console.error('Deployment error:', error);
      setDeployError(error.message || 'Failed to deploy token');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="deploy-token">
      <h2>Deploy Your Token</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            name="name"
            placeholder="e.g., Peace Token, Love Token, Zen Token"
            value={tokenInfo.name}
            onChange={handleInputChange}
            required
          />
          <label>Token Name</label>
        </div>

        <div className="form-group">
          <input
            type="text"
            name="symbol"
            placeholder="e.g., PEACE, LOVE, ZEN"
            value={tokenInfo.symbol}
            onChange={handleInputChange}
            required
          />
          <label>Token Symbol</label>
          <small>3-5 uppercase letters only</small>
        </div>

        <div className="form-group">
          <input
            type="number"
            name="totalSupply"
            placeholder="e.g., 1000000, 7777777, 8888888"
            value={tokenInfo.totalSupply}
            onChange={handleInputChange}
            required
            min="0"
          />
          <label>Total Supply</label>
        </div>

        <button 
          type="submit" 
          className="deploy-button"
          disabled={isDeploying}
        >
          {isDeploying ? 'Deploying...' : 'Deploy Token'}
        </button>
      </form>

      {deployError && (
        <div className="error-message">
          {deployError}
        </div>
      )}

      {deploySuccess && (
        <div className="success-message">
          <h3>Deployment Successful!</h3>
          <p>Token Address: {deploySuccess.address}</p>
        </div>
      )}
    </div>
  );
}

export default DeployToken; 