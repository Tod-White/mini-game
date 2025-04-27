import React from 'react';
import './AllocationStats.css';

const AllocationStats = () => {
  return (
    <div className="allocation-stats">
      <h2>Token Information</h2>
      <div className="allocation-content">
        <p>
          View all token holders on{' '}
          <a 
            href="https://shannon-explorer.somnia.network/token/0x3E9c46064B5f8Ab4605506841076059F3e93fbb0?tab=holders" 
            target="_blank" 
            rel="noopener noreferrer"
            className="explorer-link"
          >
            Shannon Explorer
          </a>
        </p>
      </div>
    </div>
  );
};

export default AllocationStats; 