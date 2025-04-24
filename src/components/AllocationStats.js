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
            href="https://shannon-explorer.somnia.network/token/0xD3D811fE6eDb5f477C1eD985DC8D9633853C675e?tab=holders" 
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