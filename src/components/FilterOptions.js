import React from 'react';
import SearchBar from './SearchBar';

const FilterOptions = ({ 
  freezeListOrder, 
  onlyUnsortedWatched, 
  onlyUnwatched, 
  mostlyUnwatched, 
  searchTerm, 
  showOnlyStarred,
  onToggleFreezeListOrder,
  onToggleUnsortedWatched,
  onToggleUnwatched,
  onToggleMostlyUnwatched,
  onSearchChange,
  onToggleShowOnlyStarred
}) => {
  return (
    <div className="filter-options">
      <div className="filter-groups">
        <div className="filter-group">
          <h4>List Filters</h4>
          <div className="checkbox-group">
            <div className="checkbox-item">
              <input 
                id="freeze-order"
                type="checkbox" 
                checked={freezeListOrder} 
                onChange={onToggleFreezeListOrder} 
              />
              <label htmlFor="freeze-order">Freeze List Order</label>
            </div>
            <div className="checkbox-item">
              <input 
                id="unsorted-watched"
                type="checkbox" 
                checked={onlyUnsortedWatched} 
                onChange={onToggleUnsortedWatched} 
              />
              <label htmlFor="unsorted-watched">Only Unsorted Watched</label>
            </div>
            <div className="checkbox-item">
              <input 
                id="only-unwatched"
                type="checkbox" 
                checked={onlyUnwatched} 
                onChange={onToggleUnwatched} 
              />
              <label htmlFor="only-unwatched">Only Unwatched</label>
            </div>
            <div className="checkbox-item">
              <input 
                id="mostly-unwatched"
                type="checkbox" 
                checked={mostlyUnwatched} 
                onChange={onToggleMostlyUnwatched} 
              />
              <label htmlFor="mostly-unwatched">Mostly Unwatched</label>
            </div>
          </div>
        </div>
        
        <div className="filter-group">
          <h4>Star Filter</h4>
          <div className="checkbox-item">
            <input 
              id="only-starred"
              type="checkbox" 
              checked={showOnlyStarred} 
              onChange={onToggleShowOnlyStarred} 
            />
            <label htmlFor="only-starred">Show Only Starred</label>
          </div>
        </div>
      </div>
      
      <div className="search-group">
        <h4>Search</h4>
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={onSearchChange} 
        />
      </div>
    </div>
  );
};

export default FilterOptions;