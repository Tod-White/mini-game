import React from 'react';
import './FactoryPage.css';
import TokenList from './TokenList';

const FactoryPage = ({ isConnected, account }) => {
  return (
    <div className="factory-page">
      <TokenList isConnected={isConnected} account={account} />
    </div>
  );
};

export default FactoryPage; 