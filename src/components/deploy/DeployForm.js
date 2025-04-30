import React, { useState, useEffect } from 'react';
import './DeployForm.css';
import { 
  getRequiredBurnAmount, 
  getFaithBalance, 
  getFaithAllowance,
  approveFaithForFactory,
  deployPrayerToken,
  subscribeToTransaction,
  unsubscribeFromTransaction,
  TX_STATUS,
  EXPLORER_URL
} from '../../utils/blockchain';
import TokenPreview from './TokenPreview';

const DeployForm = ({ isConnected, account, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: 100000
  });
  
  const [errors, setErrors] = useState({});
  const [burnAmount, setBurnAmount] = useState(0);
  const [faithBalance, setFaithBalance] = useState(0);
  const [faithAllowance, setFaithAllowance] = useState(0);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState('form'); // form, preview, approval, deploying, success
  const [txHash, setTxHash] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [deployedAddress, setDeployedAddress] = useState(null);
  
  // Load burn amount and user balance on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get required burn amount
        const amount = await getRequiredBurnAmount();
        setBurnAmount(parseFloat(amount));
        
        if (isConnected && account) {
          // Get FAITH token balance
          const balance = await getFaithBalance(account);
          setFaithBalance(parseFloat(balance));
          
          // Get FAITH token allowance
          const allowance = await getFaithAllowance(account);
          setFaithAllowance(parseFloat(allowance));
        }
      } catch (error) {
        console.error("Error loading deployment data:", error);
      }
    };
    
    loadData();
  }, [isConnected, account]);
  
  // Clean up transaction subscription when component unmounts
  useEffect(() => {
    return () => {
      if (txHash) {
        unsubscribeFromTransaction(txHash);
      }
    };
  }, [txHash]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert totalSupply to number if applicable
    const processedValue = name === 'totalSupply' ? 
      (value === '' ? '' : parseInt(value, 10)) : 
      value;
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    
    // Clear specific error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Token name is required';
    }
    
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Token symbol is required';
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = 'Symbol should be 10 characters or less';
    }
    
    if (!formData.totalSupply) {
      newErrors.totalSupply = 'Total supply is required';
    } else if (formData.totalSupply <= 0) {
      newErrors.totalSupply = 'Total supply must be greater than 0';
    } else if (formData.totalSupply > 1000000000) {
      newErrors.totalSupply = 'Total supply must be less than 1 billion';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (validateForm()) {
      // Move to preview step
      setDeploymentStep('preview');
    }
  };
  
  // Handle FAITH token approval
  const handleApprove = async () => {
    if (!isConnected) return;
    
    setIsApproving(true);
    setTxStatus(null);
    setTxHash(null);
    
    try {
      // Approve FAITH tokens for factory
      const hash = await approveFaithForFactory(burnAmount);
      setTxHash(hash);
      
      // Subscribe to transaction updates
      subscribeToTransaction(hash, handleApprovalUpdate);
    } catch (error) {
      console.error("Approval error:", error);
      setIsApproving(false);
      
      // Set error message
      setErrors({
        ...errors,
        approval: error.message || "Failed to approve FAITH tokens. Please try again."
      });
    }
  };
  
  // Handle approval transaction updates
  const handleApprovalUpdate = (update) => {
    setTxStatus(update.status);
    
    if (update.status === TX_STATUS.CONFIRMED) {
      // Approval confirmed, update allowance
      const checkAllowance = async () => {
        try {
          const allowance = await getFaithAllowance(account);
          setFaithAllowance(parseFloat(allowance));
          
          // Reset approval state
          setIsApproving(false);
          setTxHash(null);
          setTxStatus(null);
          
          // Move to deployment step if allowance is sufficient
          if (parseFloat(allowance) >= burnAmount) {
            // Show deploy button instead of auto-deploying
            setDeploymentStep('approved');
          }
        } catch (error) {
          console.error("Error checking allowance:", error);
          setIsApproving(false);
        }
      };
      
      checkAllowance();
    } else if (update.status === TX_STATUS.FAILED) {
      // Approval failed
      setIsApproving(false);
      setErrors({
        ...errors,
        approval: update.error || "Approval transaction failed. Please try again."
      });
    }
  };
  
  // Handle token deployment
  const handleDeploy = async () => {
    if (!isConnected) return;
    
    setIsDeploying(true);
    setTxStatus(null);
    setTxHash(null);
    
    try {
      // Deploy token
      const hash = await deployPrayerToken(
        formData.name,
        formData.symbol,
        formData.totalSupply
      );
      setTxHash(hash);
      
      // Subscribe to transaction updates
      subscribeToTransaction(hash, handleDeploymentUpdate);
    } catch (error) {
      console.error("Deployment error:", error);
      setIsDeploying(false);
      
      // Set error message
      setErrors({
        ...errors,
        deployment: error.message || "Failed to deploy token. Please try again."
      });
    }
  };
  
  // Handle deployment transaction updates
  const handleDeploymentUpdate = async (update) => {
    setTxStatus(update.status);
    
    if (update.status === TX_STATUS.CONFIRMED) {
      // Try to extract the deployed token address from the transaction receipt
      // This would typically be done by parsing the TokenDeployed event from the transaction logs
      // For simplicity, we'll assume we need to wait for backend indexing and just show success
      
      try {
        // In a real implementation, you would parse the transaction receipt and extract the token address
        // For now, we'll just set a placeholder
        setDeployedAddress("Successfully deployed! Check your tokens in the Factory page.");
        
        // Update FAITH balance after burning
        const balance = await getFaithBalance(account);
        setFaithBalance(parseFloat(balance));
        
        // Reset deployment state
        setIsDeploying(false);
        
        // Move to success step
        setDeploymentStep('success');
      } catch (error) {
        console.error("Error processing deployment:", error);
        setIsDeploying(false);
      }
    } else if (update.status === TX_STATUS.FAILED) {
      // Deployment failed
      setIsDeploying(false);
      setErrors({
        ...errors,
        deployment: update.error || "Deployment transaction failed. Please try again."
      });
    }
  };
  
  // Go back to form step
  const handleBackToForm = () => {
    setDeploymentStep('form');
  };
  
  // Go back to preview step
  const handleBackToPreview = () => {
    setDeploymentStep('preview');
  };
  
  // Start deployment process
  const handleStartDeploy = () => {
    // Check if user has sufficient FAITH balance
    if (faithBalance < burnAmount) {
      setErrors({
        ...errors,
        balance: `Insufficient FAITH balance. You need at least ${burnAmount} FAITH tokens.`
      });
      return;
    }
    
    // Check if approval is needed
    if (faithAllowance < burnAmount) {
      setDeploymentStep('approval');
    } else {
      // If already approved, go to approved step instead of direct deployment
      setDeploymentStep('approved');
    }
  };
  
  // Handle close and reset form
  const handleClose = () => {
    // Unsubscribe from transaction if active
    if (txHash) {
      unsubscribeFromTransaction(txHash);
    }
    
    // Reset form
    setFormData({
      name: '',
      symbol: '',
      totalSupply: 100000
    });
    
    // Reset state
    setErrors({});
    setIsApproving(false);
    setIsDeploying(false);
    setDeploymentStep('form');
    setTxHash(null);
    setTxStatus(null);
    setDeployedAddress(null);
    
    // Call parent close handler
    onClose();
  };
  
  // Render form step
  const renderFormStep = () => (
    <div className="deploy-form-container">
      <h2>Deploy Your Prayer Token</h2>
      <p className="deploy-description">
        Create your own prayer token that anyone can mine through prayer, just like FAITH.
        Each token you deploy will burn {burnAmount} FAITH tokens.
      </p>
      
      {faithBalance < burnAmount && (
        <div className="error-message">
          You need at least {burnAmount} FAITH tokens to deploy a new token.
          Your current balance: {faithBalance.toFixed(2)} FAITH
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="deploy-form">
        <div className="form-group">
          <label htmlFor="name">Token Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Hope Token"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="symbol">Token Symbol</label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            placeholder="e.g., HOPE"
            className={errors.symbol ? 'error' : ''}
          />
          {errors.symbol && <div className="error-message">{errors.symbol}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="totalSupply">Total Supply</label>
          <input
            type="number"
            id="totalSupply"
            name="totalSupply"
            value={formData.totalSupply}
            onChange={handleChange}
            placeholder="e.g., 100000"
            className={errors.totalSupply ? 'error' : ''}
          />
          {errors.totalSupply && <div className="error-message">{errors.totalSupply}</div>}
          <div className="form-help">
            Each prayer will mine 1,000 tokens until the total supply is reached.
          </div>
        </div>
        
        <div className="deploy-form-actions">
          <button type="button" className="cancel-button" onClick={handleClose}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="confirm-button"
            disabled={!isConnected || faithBalance < burnAmount}
          >
            Preview Token
          </button>
        </div>
      </form>
    </div>
  );
  
  // Render preview step
  const renderPreviewStep = () => (
    <div className="deploy-preview-container">
      <h2>Preview Your Prayer Token</h2>
      
      <TokenPreview 
        name={formData.name}
        symbol={formData.symbol}
        totalSupply={formData.totalSupply}
        burnAmount={burnAmount}
      />
      
      <div className="deploy-notice">
        <p>
          <strong>Please Note:</strong> Deploying this token will burn {burnAmount} FAITH tokens.
          This action cannot be undone.
        </p>
      </div>
      
      <div className="deploy-form-actions">
        <button type="button" className="cancel-button" onClick={handleBackToForm}>
          Back to Form
        </button>
        <button 
          type="button" 
          className="confirm-button"
          onClick={handleStartDeploy}
          disabled={!isConnected || faithBalance < burnAmount}
        >
          Deploy Token
        </button>
      </div>
    </div>
  );
  
  // Render approval step
  const renderApprovalStep = () => (
    <div className="deploy-approval-container">
      <h2>Approve FAITH Token Spending</h2>
      
      <div className="approval-info">
        <p>
          Before deploying your token, you need to approve the factory contract to burn {burnAmount} of your FAITH tokens.
        </p>
        
        <div className="approval-status">
          <div className="approval-amount">
            <span>Required Approval:</span>
            <span>{burnAmount} FAITH</span>
          </div>
          <div className="approval-amount">
            <span>Current Allowance:</span>
            <span>{faithAllowance.toFixed(2)} FAITH</span>
          </div>
          <div className="approval-amount">
            <span>Your Balance:</span>
            <span>{faithBalance.toFixed(2)} FAITH</span>
          </div>
        </div>
      </div>
      
      {errors.approval && (
        <div className="error-message">
          {errors.approval}
        </div>
      )}
      
      {txHash && txStatus && (
        <div className={`tx-status ${txStatus}`}>
          <div className="tx-status-text">
            {txStatus === TX_STATUS.PENDING && "Approval transaction pending..."}
            {txStatus === TX_STATUS.CONFIRMED && "Approval successful!"}
            {txStatus === TX_STATUS.FAILED && "Approval failed. Please try again."}
          </div>
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
      
      <div className="deploy-form-actions">
        <button type="button" className="cancel-button" onClick={handleBackToPreview}>
          Back to Preview
        </button>
        <button 
          type="button" 
          className="confirm-button"
          onClick={handleApprove}
          disabled={isApproving || faithBalance < burnAmount}
        >
          {isApproving ? "Approving..." : "Approve FAITH Tokens"}
        </button>
      </div>
    </div>
  );
  
  // Render deploying step
  const renderDeployingStep = () => (
    <div className="deploy-deploying-container">
      <h2>Deploying Your Prayer Token</h2>
      
      <div className="deploying-info">
        <p>
          Your token is being deployed to the blockchain. This process may take a few moments.
        </p>
        <p>
          <strong>{burnAmount} FAITH tokens</strong> will be burned during this process.
        </p>
      </div>
      
      {errors.deployment && (
        <div className="error-message">
          {errors.deployment}
        </div>
      )}
      
      {txHash && txStatus && (
        <div className={`tx-status ${txStatus}`}>
          <div className="tx-status-text">
            {txStatus === TX_STATUS.PENDING && "Deployment transaction pending..."}
            {txStatus === TX_STATUS.CONFIRMED && "Deployment successful!"}
            {txStatus === TX_STATUS.FAILED && "Deployment failed. Please try again."}
          </div>
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
      
      <div className="deploy-loader">
        {isDeploying && <div className="loader"></div>}
      </div>
    </div>
  );
  
  // Render success step
  const renderSuccessStep = () => (
    <div className="deploy-success-container">
      <h2>Deployment Successful!</h2>
      
      <div className="success-info">
        <div className="success-icon">✅</div>
        <p>
          Your prayer token has been successfully deployed!
        </p>
        <div className="token-details">
          <div className="token-detail">
            <span>Token Name:</span>
            <span>{formData.name}</span>
          </div>
          <div className="token-detail">
            <span>Token Symbol:</span>
            <span>{formData.symbol}</span>
          </div>
          <div className="token-detail">
            <span>Total Supply:</span>
            <span>{formData.totalSupply}</span>
          </div>
          <div className="token-detail">
            <span>FAITH Burned:</span>
            <span>{burnAmount}</span>
          </div>
        </div>
        
        {deployedAddress && (
          <div className="deployed-address">
            <p>{deployedAddress}</p>
          </div>
        )}
        
        <div className="success-actions">
          <p>
            Users can now pray to mine your token just like they do with FAITH!
          </p>
        </div>
      </div>
      
      <div className="deploy-form-actions">
        <button type="button" className="primary-button" onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  );
  
  // Render approved step - new step after approval is confirmed
  const renderApprovedStep = () => (
    <div className="deploy-approval-container">
      <h2>FAITH Tokens Approved</h2>
      
      <div className="approval-info">
        <p>
          Your FAITH tokens have been approved for burning. You can now deploy your token.
        </p>
        
        <div className="approval-status">
          <div className="approval-amount">
            <span>Required Burn Amount:</span>
            <span>{burnAmount} FAITH</span>
          </div>
          <div className="approval-amount">
            <span>Current Allowance:</span>
            <span>{faithAllowance.toFixed(2)} FAITH</span>
          </div>
          <div className="approval-amount">
            <span>Your Balance:</span>
            <span>{faithBalance.toFixed(2)} FAITH</span>
          </div>
        </div>
      </div>
      
      <div className="deploy-form-actions">
        <button type="button" className="cancel-button" onClick={handleBackToPreview}>
          Back to Preview
        </button>
        <button 
          type="button" 
          className="confirm-button"
          onClick={() => {
            setDeploymentStep('deploying');
            handleDeploy();
          }}
          disabled={faithBalance < burnAmount}
        >
          Deploy Token
        </button>
      </div>
    </div>
  );
  
  // Render the appropriate step
  const renderStep = () => {
    switch (deploymentStep) {
      case 'preview':
        return renderPreviewStep();
      case 'approval':
        return renderApprovalStep();
      case 'deploying':
        return renderDeployingStep();
      case 'success':
        return renderSuccessStep();
      case 'approved':
        return renderApprovedStep();
      default:
        return renderFormStep();
    }
  };
  
  return (
    <div className="deploy-modal">
      <div className="deploy-modal-content">
        <button className="close-button" onClick={handleClose}>×</button>
        {renderStep()}
      </div>
    </div>
  );
};

export default DeployForm; 