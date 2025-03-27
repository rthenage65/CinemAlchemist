import React from 'react';
import MovieRow from './MovieRow';

const MovieList = ({ 
  sortedList, 
  onlyUnsortedWatched, 
  onlyUnwatched, 
  searchTerm, 
  showOnlyStarred, 
  savedSettings,
  pageNumber, 
  PAGE_SIZE, 
  movieData, 
  primaryKey, 
  Columns,
  saveSettings,
  configuration,
  getMovieValue,
  parseJSONArraySafe
}) => {
  // Create a custom column order that moves star before title and score after watched
  const createCustomColumnOrder = () => {
    const orderedColumnsElements = [];
    
    // Process all columns in their original order
    Object.entries(Columns).forEach(([columnName, columnInfo]) => {
      const isListColumn = columnInfo.type === "list" || 
                         (columnInfo.type === "string" && columnInfo.subType === "enum");
      const isInputColumn = columnInfo.inPersonalSettings;
      const className = isListColumn ? 'wide-column' : isInputColumn ? 'medium-column' : '';
      
      // If it's the title column, add star column before it
      if (columnName === 'title') {
        // Star column
        orderedColumnsElements.push(
          <th key="star-column" className="vertical-header">
            <div className="vertical-text">Star</div>
          </th>
        );
      }
      
      // Add the current column
      orderedColumnsElements.push(
        <th 
          key={columnName}
          className={`vertical-header ${className}`}
        >
          <div className="vertical-text">{columnInfo.displayName}</div>
        </th>
      );
      
      // If it's the watched column, add score column after it
      if (columnName === 'watched') {
        // Score column
        orderedColumnsElements.push(
          <th key="score-column" className="vertical-header">
            <div className="vertical-text">Score</div>
          </th>
        );
      }
    });
    
    return orderedColumnsElements;
  };

  return (
    <div className="table-container">
      <table className="table">
        <thead className="sticky-top">
          <tr>
            {createCustomColumnOrder()}
          </tr>
        </thead>
        <tbody>
          {(
            onlyUnsortedWatched ? sortedList.filter(({movieIndex}) => isNaN(parseInt(savedSettings.movieSettings[movieData[movieIndex][primaryKey]]?.watched))) :
            onlyUnwatched ? sortedList.filter(({movieIndex}) => parseInt(savedSettings.movieSettings[movieData[movieIndex][primaryKey]]?.watched??0)===0) : 
            sortedList
          ).filter(({movieIndex}) => {
            // Filter by search term if it exists
            return !searchTerm || movieData[movieIndex].title.toLowerCase().includes(searchTerm.toLowerCase());
          }).filter(({movieIndex}) => {
            // Filter by starred status if showOnlyStarred is true
            return !showOnlyStarred || savedSettings.starredMovies[movieData[movieIndex][primaryKey]] === true;
          }).slice(PAGE_SIZE*pageNumber, PAGE_SIZE*(pageNumber+1)).map(({movieIndex, sumValue}) => (
            <MovieRow 
              key={movieIndex} 
              movie={movieData[movieIndex]} 
              sumValue={sumValue} 
              savedSettings={savedSettings} 
              saveSettings={saveSettings} 
              configuration={configuration}
              primaryKey={primaryKey}
              Columns={Columns}
              getMovieValue={getMovieValue}
              parseJSONArraySafe={parseJSONArraySafe}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MovieList;