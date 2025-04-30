import React from 'react';
import './DeployPage.css';
import DeployForm from './DeployForm';

const DeployPage = ({ isConnected, account, onClose }) => {
  return (
    <div className="deploy-page">
      <DeployForm isConnected={isConnected} account={account} onClose={onClose} />
    </div>
  );
};

export default DeployPage; 