import React from 'react';
import './PrayerStats.css';

const PrayerStats = ({ balance, mined, totalMined, totalSupply }) => {
  const formatNumber = (num) => {
    // Convert to number if it's a string
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    
    // Handle NaN or undefined
    if (isNaN(numValue) || numValue === undefined) return '0';
    
    // Format with commas
    return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Calculate percentage of total supply mined by this user
  const percentOfTotal = totalSupply > 0 
    ? ((mined / totalSupply) * 100).toFixed(2) 
    : '0.00';
    
  return (
    <div className="prayer-stats">
      <h3>Your Prayer Stats</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-emoji">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#B19CD9" strokeWidth="2" />
              <path d="M12 6V18" stroke="#B19CD9" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 10H16" stroke="#B19CD9" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 14H16" stroke="#B19CD9" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stat-value">{formatNumber(balance)}</div>
          <div className="stat-label">FAITH Balance</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-emoji">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 2.99982C17 2.99982 13 2.99982 12 6.99982C11 2.99982 7 2.99982 7 2.99982C4 2.99982 2 4.99982 2 7.99982C2 15.9998 12 20.9998 12 20.9998C12 20.9998 22 15.9998 22 7.99982C22 4.99982 20 2.99982 17 2.99982Z" stroke="#B19CD9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-value">{formatNumber(mined)}</div>
          <div className="stat-label">Total Prayed</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-emoji">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 12H18L15 21L9 3L6 12H2" stroke="#B19CD9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-value">{percentOfTotal}%</div>
          <div className="stat-label">of Global Supply</div>
        </div>
      </div>
    </div>
  );
};

export default PrayerStats; 