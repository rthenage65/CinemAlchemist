import React from 'react';

class MovieRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      overrideThisMovieSettings: {}, 
    };
  }
  
  toggleStar = () => {
    const { movie, savedSettings, saveSettings, primaryKey } = this.props;
    const movieId = movie[primaryKey];
    const isCurrentlyStarred = savedSettings.starredMovies[movieId] === true;
    
    const updatedStarredMovies = {...savedSettings.starredMovies};
    updatedStarredMovies[movieId] = !isCurrentlyStarred;
    
    saveSettings({ starredMovies: updatedStarredMovies });
  };

  renderStarColumn = () => {
    const { movie, savedSettings, primaryKey } = this.props;
    return (
      <td>
        <button 
          onClick={this.toggleStar}
          className={`star-button ${savedSettings.starredMovies[movie[primaryKey]] ? 'starred' : ''}`}
        >
          {savedSettings.starredMovies[movie[primaryKey]] ? '★' : '☆'}
        </button>
      </td>
    );
  };

  renderScoreColumn = (sumValue) => {
    return (
      <td>{parseFloat(parseFloat(sumValue).toFixed(2))}</td>
    );
  };

  render() {
    const { movie, savedSettings, saveSettings, configuration, sumValue, primaryKey, getMovieValue, Columns, parseJSONArraySafe } = this.props;
    const thisMovieSettings = {...(savedSettings.movieSettings[movie[primaryKey]] || {}), ...this.state.overrideThisMovieSettings};
    const updateThisMovieSettings = (changes) => {
      this.setState({overrideThisMovieSettings: {...this.state.overrideThisMovieSettings, ...changes}});
    };
    const saveThisMovieSettings = () => {
      saveSettings({movieSettings: {...savedSettings.movieSettings, [movie[primaryKey]]: thisMovieSettings}});
    };
    
    // Create cells in the same order as the headers
    const cells = [];
    
    Object.entries(Columns).forEach(([columnName, columnInfo]) => {
      const isListColumn = columnInfo.type === "list" || 
                    (columnInfo.type === "string" && columnInfo.subType === "enum");
      const isInputColumn = columnInfo.inPersonalSettings;
      const className = isListColumn ? 'wide-column' : isInputColumn ? 'medium-column' : '';
      
      const thisValue = getMovieValue({
        value: movie[columnName], 
        primaryKey: movie[primaryKey], 
        columnName, 
        columnInfo, 
        savedSettings, 
        configuration
      });
      
      // Add star column before title
      if (columnName === 'title') {
        cells.push(this.renderStarColumn());
      }
      
      // Regular column cell
      let displayVal;
      if (columnInfo.inPersonalSettings) {
        // they can change the input in this row
        displayVal = (
          <input 
            style={{width:"80px"}} 
            type="number" 
            value={thisMovieSettings[columnName]} 
            onChange={(e)=>updateThisMovieSettings({[columnName]: e.target.value})} 
            onBlur={saveThisMovieSettings} 
          />
        );
      } else if (columnInfo.type === "list") {
        displayVal = parseJSONArraySafe(movie[columnName]).map(g=>g.name).sort().join(", ");
      } else if (columnInfo.date) {
        displayVal = (new Date(movie[columnName])).getFullYear()||0;
      } else if (columnInfo.minutes) {
        displayVal = Math.floor(parseInt(movie[columnName])/60)+":"+(parseInt(movie[columnName])%60).toString().padStart(2, "0");
      } else if (columnInfo.type==="image") {
        displayVal = (
          <img src={"https://media.themoviedb.org/t/p/w94_and_h141_bestv2"+movie[columnName]} alt="" />
        );
      } else {
        displayVal = movie[columnName];
      }
      
      if (columnInfo.thousandsComma) {
        const str = parseInt(displayVal)+"";
        let arr = [];
        let index = str.length;
        while (index > 0) {
          arr.unshift(str.slice(Math.max(index-3, 0), index));
          index -= 3;
        }
        displayVal = arr.join(",");
      }
      
      if (columnInfo.dollarSign) {
        displayVal = "$"+displayVal;
      }
      
      cells.push(
        <td key={columnName} className={className} style={columnInfo.bold ? {fontWeight: "bold"} : {}}>
          <span>{displayVal}</span>
          {columnInfo.weighable && (
            <span className="score-span">({parseFloat(thisValue.toFixed(2))})</span>
          )}
        </td>
      );
      
      // Add score column after watched
      if (columnName === 'watched') {
        cells.push(this.renderScoreColumn(sumValue));
      }
    });
    
    return (
      <tr key={movie.id}>
        {cells}
      </tr>
    );
  }
}

export default MovieRow;