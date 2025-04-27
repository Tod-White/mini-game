import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ progress, remaining, total, title = 'Faith' }) => {
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Ensure we have a valid progress value (prevent NaN or negative values)
  const safeProgress = isNaN(progress) || progress < 0 ? 0 : progress;
  
  // Format with 3 decimal places
  const percentText = `${safeProgress.toFixed(3)}%`;
  
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