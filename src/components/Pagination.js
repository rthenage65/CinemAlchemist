import React from 'react';

const Pagination = ({ pageNumber, maxPages, onPageChange }) => {
  return (
    <div className="pagination">
      <button 
        disabled={pageNumber <= 0} 
        onClick={() => onPageChange(pageNumber - 1)}
      >
        ←
      </button>
      <span>{pageNumber + 1}</span>
      <button 
        disabled={pageNumber >= maxPages - 1} 
        onClick={() => onPageChange(pageNumber + 1)}
      >
        →
      </button>
    </div>
  );
};

export default Pagination;