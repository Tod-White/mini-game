import React from 'react';
import './TokenFilter.css';

const TokenFilter = ({ filters, onFilterChange, onRefresh, isConnected }) => {
  // Handle search input change
  const handleSearchChange = (e) => {
    onFilterChange({ search: e.target.value });
  };
  
  // Handle sort option change
  const handleSortChange = (e) => {
    onFilterChange({ sortBy: e.target.value });
  };
  
  // Handle "Only mine" toggle
  const handleOnlyMineChange = (e) => {
    onFilterChange({ onlyMine: e.target.checked });
  };
  
  // Clear all filters
  const clearFilters = () => {
    onFilterChange({
      search: '',
      sortBy: 'newest',
      onlyMine: false
    });
  };
  
  return (
    <div className="token-filter">
      <div className="filter-group search-group">
        <input
          type="text"
          placeholder="Search by name, symbol, or address"
          value={filters.search}
          onChange={handleSearchChange}
          className="search-input"
        />
        {filters.search && (
          <button className="clear-search-button" onClick={() => onFilterChange({ search: '' })}>
            ×
          </button>
        )}
      </div>
      
      <div className="filter-group sort-group">
        <label htmlFor="sort-select">Sort by:</label>
        <select
          id="sort-select"
          value={filters.sortBy}
          onChange={handleSortChange}
          className="sort-select"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="symbol-asc">Symbol (A-Z)</option>
          <option value="symbol-desc">Symbol (Z-A)</option>
          <option value="supply-asc">Supply (Low to High)</option>
          <option value="supply-desc">Supply (High to Low)</option>
        </select>
      </div>
      
      {isConnected && (
        <div className="filter-group mine-group">
          <label className="mine-label">
            <input
              type="checkbox"
              checked={filters.onlyMine}
              onChange={handleOnlyMineChange}
              className="mine-checkbox"
            />
            Only My Tokens
          </label>
        </div>
      )}
      
      <div className="filter-actions">
        {(filters.search || filters.onlyMine || filters.sortBy !== 'newest') && (
          <button className="clear-filters-button" onClick={clearFilters}>
            Clear All
          </button>
        )}
        
        <button className="refresh-button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default TokenFilter; 