import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ progress = 0, remaining = 0, total = 0, title = 'Token' }) => {
  const formatNumber = (num) => {
    // Handle undefined, null, or invalid values
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    // Convert to number if it's a string
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    // Format with commas
    return numValue.toLocaleString();
  };
  
  // Ensure we have a valid progress value (prevent NaN or negative values)
  const safeProgress = isNaN(progress) || progress < 0 ? 0 : progress;
  
  // Format with 2 decimal places
  const percentText = `${safeProgress.toFixed(2)}%`;
  
  return (
    <div className="progress-container">
      <div className="token-name">{title}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${safeProgress}%` }}></div>
        <div className="progress-text">{percentText}</div>
      </div>
      
      <div className="progress-stats">
        <div className="stats-item">
          <span className="stats-label">Remaining:</span>
          <span className="stats-value">{formatNumber(remaining)} {title}</span>
        </div>
        <div className="stats-item">
          <span className="stats-label">Total Supply:</span>
          <span className="stats-value">{formatNumber(total)} {title}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar; 