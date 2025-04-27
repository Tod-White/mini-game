import React from 'react';
import './PrayButton.css';

const PrayButton = ({ status, isConnected, onPray }) => {
  const getButtonText = () => {
    if (!isConnected) {
      return ''; // Don't show any text when not connected
    }
    
    switch (status) {
      case 'praying':
        return 'Praying...';
      case 'prayed-out':
        return 'All Tokens Prayed';
      default:
        return 'Pray Now';
    }
  };
  
  const handleClick = () => {
    if (!isConnected) return;
    if (status === 'ready') onPray();
  };
  
  const isDisabled = !isConnected || status === 'praying' || status === 'prayed-out';
  const buttonClass = isConnected ? `pray-button ${status}` : 'pray-button hidden';
  
  return (
    <div className="pray-button-container">
      <button 
        className={buttonClass}
        onClick={handleClick} 
        disabled={isDisabled}
      >
        {getButtonText()}
        {status === 'praying' && (
          <div className="praying-spinner">
            <div className="spinner"></div>
          </div>
        )}
      </button>
      
      {status === 'prayed-out' && (
        <div className="prayed-out-message">
          All 777,777,000 Faith tokens have been claimed. Praying is now closed.
        </div>
      )}
    </div>
  );
};

export default PrayButton; 