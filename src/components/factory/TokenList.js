import React, { useState, useEffect } from 'react';
import './TokenList.css';
import { getAllTokens } from '../../utils/blockchain';
import TokenCard from './TokenCard';
import TokenFilter from './TokenFilter';

const TokenList = ({ isConnected, account }) => {
  const [tokens, setTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'newest',
    onlyMine: false
  });
  
  // Load tokens on mount and when account changes
  useEffect(() => {
    const loadTokens = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const tokenList = await getAllTokens();
        setTokens(tokenList);
        // Apply initial filtering
        applyFilters(tokenList, filters);
        setLoading(false);
      } catch (error) {
        console.error("Error loading tokens:", error);
        setError("Failed to load tokens. Please try again later.");
        setLoading(false);
      }
    };
    
    loadTokens();
  }, [account]);
  
  // Apply filters when filters change
  useEffect(() => {
    applyFilters(tokens, filters);
  }, [filters, tokens]);
  
  // Apply filters to tokens
  const applyFilters = (tokenList, currentFilters) => {
    let result = [...tokenList];
    
    // Apply search filter
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      result = result.filter(token => 
        token.name.toLowerCase().includes(searchLower) || 
        token.symbol.toLowerCase().includes(searchLower) ||
        token.tokenAddress.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply "only mine" filter
    if (currentFilters.onlyMine && account) {
      result = result.filter(token => 
        token.creator.toLowerCase() === account.toLowerCase()
      );
    }
    
    // Apply sorting
    switch (currentFilters.sortBy) {
      case 'newest':
        result.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'oldest':
        result.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'symbol-asc':
        result.sort((a, b) => a.symbol.localeCompare(b.symbol));
        break;
      case 'symbol-desc':
        result.sort((a, b) => b.symbol.localeCompare(a.symbol));
        break;
      case 'supply-asc':
        result.sort((a, b) => parseFloat(a.totalSupply) - parseFloat(b.totalSupply));
        break;
      case 'supply-desc':
        result.sort((a, b) => parseFloat(b.totalSupply) - parseFloat(a.totalSupply));
        break;
      default:
        break;
    }
    
    setFilteredTokens(result);
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters({
      ...filters,
      ...newFilters
    });
  };
  
  // Refresh token list
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const tokenList = await getAllTokens();
      setTokens(tokenList);
      applyFilters(tokenList, filters);
      setLoading(false);
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      setError("Failed to refresh tokens. Please try again later.");
      setLoading(false);
    }
  };
  
  return (
    <div className="token-list-container">
      <div className="token-list-header">
        <h2>Prayer Token Directory</h2>
        <p className="token-list-description">
          Browse all prayer tokens deployed through the factory
        </p>
      </div>
      
      <TokenFilter 
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        isConnected={isConnected}
      />
      
      {error && (
        <div className="token-list-error">
          <p>{error}</p>
          <button onClick={handleRefresh} className="refresh-button">
            Try Again
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="token-list-loading">
          <div className="loader"></div>
          <p>Loading tokens...</p>
        </div>
      ) : (
        <>
          {filteredTokens.length > 0 ? (
            <div className="token-list">
              {filteredTokens.map((token) => (
                <TokenCard
                  key={token.tokenAddress}
                  token={token}
                  isUserCreator={isConnected && account && token.creator.toLowerCase() === account.toLowerCase()}
                />
              ))}
            </div>
          ) : (
            <div className="token-list-empty">
              <p>
                {filters.search || filters.onlyMine
                  ? 'No tokens match your current filters'
                  : 'No tokens have been deployed yet'}
              </p>
              {filters.search || filters.onlyMine ? (
                <button
                  onClick={() => setFilters({ search: '', sortBy: 'newest', onlyMine: false })}
                  className="clear-filters-button"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TokenList; 