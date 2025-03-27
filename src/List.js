import React from 'react';
import movieData from './data/movies_metadata.json';
// import movieData from './data/movies_metadata_full.json';
import publicConfigurations from './data/public_configurations.json';
import header from './img/cinemalchemist-text.webp';
import background from './img/cinemalchemist-spilling-gold.webp';
import ColumnWeights from './components/ColumnWeights';
import MovieList from './components/MovieList';
import FilterOptions from './components/FilterOptions';
import Pagination from './components/Pagination';
import Columns, { mostlyUnwatchedColumnWeights } from './config/columns';
import { parseJSONArraySafe, getMovieValue } from './utils/movieUtils';

console.time("init");

const PAGE_SIZE = 20;
const primaryKey = "imdb_id";

// Initialize column properties
const numberColumnEntries = Object.entries(Columns).filter(([columnName, columnInfo]) => columnInfo.type === "number");
const enumColumnEntries = Object.entries(Columns).filter(([columnName, columnInfo]) => columnInfo.type === "string" && columnInfo.subType === "enum");
const listEnumColumnEntries = Object.entries(Columns).filter(([columnName, columnInfo]) => columnInfo.type === "list" && columnInfo.subType === "enum");

// Initialize min/max values and enum values
numberColumnEntries.forEach(([columnName, columnInfo]) => {
  columnInfo.maxValue = -Infinity;
  columnInfo.minValue = Infinity;
});

([...enumColumnEntries, ...listEnumColumnEntries]).forEach(([columnName, columnInfo]) => {
  columnInfo.values = {};
});

console.timeEnd("init");

console.time("column values");
movieData.forEach(movie => {
  numberColumnEntries.forEach(([columnName, columnInfo]) => {
    const value = parseFloat(movie[columnName]);
    if (value > columnInfo.maxValue) {
      columnInfo.maxValue = value;
    } else if (value < columnInfo.minValue) {
      columnInfo.minValue = value;
    }
  });
  
  enumColumnEntries.forEach(([columnName, columnInfo]) => {
    const value = movie[columnName];
    columnInfo.values[value] = (columnInfo.values[value] || 0) + 1;
  });
  
  listEnumColumnEntries.forEach(([columnName, columnInfo]) => {
    parseJSONArraySafe(movie[columnName]).forEach(({name:value}) => {
      columnInfo.values[value] = (columnInfo.values[value] || 0) + 1;
    });
  });
});

console.log(`Columns:`, Columns);

const initialConfigurationId = crypto.randomUUID();
const DefaultSettings = {
  configurations: {
    [initialConfigurationId]: {
      columnWeights: structuredClone(Object.values(publicConfigurations)[0].columnWeights),
      displayName: "My Picks"
    }
  },
  currentConfigurationId: initialConfigurationId,
  movieSettings: {}, // settings for individual movies, like watchlist or watched
  starredMovies: {} // store starred movies by primary key
};

console.timeEnd("column values");

export default class List extends React.Component {
  constructor(props) {
    super(props);
    let savedSettings;
    try {
      savedSettings = JSON.parse(localStorage.getItem('savedSettings'));
      savedSettings = {...DefaultSettings, ...savedSettings};
      // Ensure starredMovies exists in the structure
      if (!savedSettings.starredMovies) {
        savedSettings.starredMovies = {};
      }
    } catch (e) {
      savedSettings = DefaultSettings;
    }
    this.state = {
      savedSettings,
      pageNumber: 0,
      freezeListOrder: false,
      onlyUnsortedWatched: false,
      onlyUnwatched: false,
      mostlyUnwatched: false,
      searchTerm: '',
      showOnlyStarred: false,
    };
  }

  saveSettings = (settings) => {
    this.setState(({ savedSettings: prevSettings }) => {
      const newSettings = {...prevSettings, ...settings};
      localStorage.setItem('savedSettings', JSON.stringify(newSettings));
      return {
        savedSettings: newSettings
      };
    });
  }

  copyConfiguration = (configuration) => {
    const newId = crypto.randomUUID();
    let newDisplayName = configuration.displayName;
    const displayMatch = conf => conf.displayName === newDisplayName;
    do {
      const number = / \d+$/.exec(newDisplayName)?.[0];
      if (number) {
        newDisplayName = newDisplayName.replace(/ \d+$/, ` ${parseInt(number)+1}`);
      } else {
        newDisplayName = newDisplayName + " 2";
      }
    } while (Object.values({...publicConfigurations, ...this.state.savedSettings.configurations}).find(displayMatch));
    this.saveSettings({
      configurations: {...this.state.savedSettings.configurations, [newId]: {
        columnWeights: structuredClone(configuration.columnWeights), 
        displayName: newDisplayName,
      }},
      currentConfigurationId: newId,
    });
  }

  deleteConfiguration = () => {
    const configurations = this.state.savedSettings.configurations;
    delete configurations[this.state.savedSettings.currentConfigurationId];
    this.saveSettings({
      configurations,
      currentConfigurationId: Object.keys(configurations)[0] ?? Object.keys(publicConfigurations)[0],
    });
  }

  lastSort = {}
  sortMovies = ({movieData, savedSettings, configuration}) => {
    if (this.state.freezeListOrder && this.lastSort.list) {
      return {
        didChange: false, 
        sortedList: this.lastSort.list
      };
    }

    const stringifiedSettings = JSON.stringify({savedSettings, configuration});
    if (this.lastSort.stringifiedSettings === stringifiedSettings) {
      return {
        didChange: false, 
        sortedList: this.lastSort.list
      };
    } else {
      const list = movieData.reduce((acc, movie, movieIndex) => {
        let sumValue = 0;
        Object.entries(Columns).forEach(([columnName, columnInfo]) => {
          sumValue += getMovieValue({
            value: movie[columnName], 
            primaryKey: movie[primaryKey], 
            columnName, 
            columnInfo, 
            savedSettings, 
            configuration
          });
        });
        const row = {
          movieIndex,
          sumValue,
        };
        // use a binary search to find the right place to insert based on the sumValue
        let left = 0;
        let right = acc.length;
        while (left < right) {
          const mid = Math.floor((left + right) / 2);
          if (acc[mid].sumValue > sumValue) {
            left = mid + 1;
          } else {
            right = mid;
          }
        }
        acc.splice(left, 0, row);
        return acc;
      }, []);
      this.lastSort = {
        stringifiedSettings,
        list,
      };
      return {
        didChange: true, 
        sortedList: list
      };
    }
  }

  handlePageChange = (newPageNumber) => {
    this.setState({ pageNumber: newPageNumber });
  }

  render() {
    console.time("render rows");
    const {
      pageNumber, 
      savedSettings, 
      freezeListOrder, 
      onlyUnsortedWatched, 
      onlyUnwatched, 
      mostlyUnwatched, 
      searchTerm, 
      showOnlyStarred
    } = this.state;
    
    const isPublicConfiguration = savedSettings.currentConfigurationId in publicConfigurations;
    const configuration = structuredClone(
      isPublicConfiguration 
        ? publicConfigurations[savedSettings.currentConfigurationId] 
        : savedSettings.configurations[savedSettings.currentConfigurationId]
    );
    
    // If they were missing any columns, add them in
    configuration.columnWeights = {...DefaultSettings.columnWeights, ...configuration.columnWeights};
    
    if (mostlyUnwatched) {
      configuration.columnWeights = {
        ...configuration.columnWeights,
        watched: structuredClone(mostlyUnwatchedColumnWeights),
      };
    }
    
    const cleanseWatched = (dirtyConfiguration) => {
      if (mostlyUnwatched) {
        if (JSON.stringify(dirtyConfiguration.columnWeights.watched) === JSON.stringify(mostlyUnwatchedColumnWeights)) {
          const realConfiguration = structuredClone(
            isPublicConfiguration 
              ? publicConfigurations[savedSettings.currentConfigurationId] 
              : savedSettings.configurations[savedSettings.currentConfigurationId]
          );
          return {
            ...dirtyConfiguration, 
            columnWeights: {
              ...dirtyConfiguration.columnWeights,
              watched: realConfiguration.columnWeights.watched,
            }
          };
        }
      }
      return dirtyConfiguration;
    };
    
    const saveConfiguration = (configuration) => {
      this.saveSettings({
        configurations: {
          ...savedSettings.configurations, 
          [savedSettings.currentConfigurationId]: cleanseWatched(configuration)
        }
      });
    };
    
    const {didChange, sortedList} = this.sortMovies({movieData, savedSettings, configuration});
    
    if (didChange) {
      this.setState({pageNumber: 0});
    }
    
    console.timeEnd("render rows");

    // Handlers for filter toggles
    const handleToggleFreezeListOrder = () => this.setState({ freezeListOrder: !freezeListOrder });
    const handleToggleUnsortedWatched = () => this.setState({ onlyUnsortedWatched: !onlyUnsortedWatched, pageNumber: 0 });
    const handleToggleUnwatched = () => this.setState({ onlyUnwatched: !onlyUnwatched, pageNumber: 0 });
    const handleToggleMostlyUnwatched = () => this.setState({ mostlyUnwatched: !mostlyUnwatched, pageNumber: 0 });
    const handleSearchChange = (value) => this.setState({ searchTerm: value, pageNumber: 0 });
    const handleToggleShowOnlyStarred = () => this.setState({ showOnlyStarred: !showOnlyStarred, pageNumber: 0 });

    // Calculate maximum number of pages
    const maxPages = Math.ceil(movieData.length / PAGE_SIZE);

    return (
      <div className="container mt-5">
        <style>
          {`
            :root {
              --background-image: url('${background}');
            }
          `}
        </style>
        <header>
          <img src={header} alt="CinemAlchemist" className="header-image" />
          <p className="app-description">
            Instructions: Adjust the settings in the Alchemy section below, then press Save. 
            View the resulting Gold List at the bottom.
          </p>
        </header>
        <ColumnWeights 
          configuration={configuration} 
          saveConfiguration={saveConfiguration} 
          copyConfiguration={configuration => this.copyConfiguration(cleanseWatched(configuration))} 
          deleteConfiguration={this.deleteConfiguration} 
          isPublicConfiguration={isPublicConfiguration}
          Columns={Columns}
        />
        <div className="configurations-container">
          <h4>My Configurations:</h4>
          <div className="button-group">
            {Object.entries(savedSettings.configurations).map(([id, conf]) => (
              <button 
                key={id}
                onClick={() => this.saveSettings({currentConfigurationId: id})} 
                className={savedSettings.currentConfigurationId === id ? 'active' : ''}
              >
                {conf.displayName}
              </button>
            ))}
          </div>
        </div>
        
        <div className="configurations-container">
          <h4>Public Configurations:</h4>
          <div className="button-group">
            {Object.entries(publicConfigurations).map(([id, conf]) => (
              <button 
                key={id}
                onClick={() => this.saveSettings({currentConfigurationId: id})} 
                className={savedSettings.currentConfigurationId === id ? 'active' : ''}
              >
                {conf.displayName}
              </button>
            ))}
          </div>
        </div>
        <h3>Gold List</h3>
        <p>
          Instructions: If you want to keep track of when you have seen each movie, check the first two boxes 
          (Freeze List Order and Only Unsorted Watched) while inputting the Year Watched.
        </p>
        
        <FilterOptions 
          freezeListOrder={freezeListOrder}
          onlyUnsortedWatched={onlyUnsortedWatched}
          onlyUnwatched={onlyUnwatched}
          mostlyUnwatched={mostlyUnwatched}
          searchTerm={searchTerm}
          showOnlyStarred={showOnlyStarred}
          onToggleFreezeListOrder={handleToggleFreezeListOrder}
          onToggleUnsortedWatched={handleToggleUnsortedWatched}
          onToggleUnwatched={handleToggleUnwatched}
          onToggleMostlyUnwatched={handleToggleMostlyUnwatched}
          onSearchChange={handleSearchChange}
          onToggleShowOnlyStarred={handleToggleShowOnlyStarred}
        />
        
        <MovieList 
          sortedList={sortedList}
          onlyUnsortedWatched={onlyUnsortedWatched}
          onlyUnwatched={onlyUnwatched}
          searchTerm={searchTerm}
          showOnlyStarred={showOnlyStarred}
          savedSettings={savedSettings}
          pageNumber={pageNumber}
          PAGE_SIZE={PAGE_SIZE}
          movieData={movieData}
          primaryKey={primaryKey}
          Columns={Columns}
          saveSettings={this.saveSettings}
          configuration={configuration}
          getMovieValue={getMovieValue}
          parseJSONArraySafe={parseJSONArraySafe}
        />
        
        <br/>
        <Pagination 
          pageNumber={pageNumber}
          maxPages={maxPages}
          onPageChange={this.handlePageChange}
        />
        <footer className="app-footer">
          <div className="footer-section data-sources">
            <h4>Data Sources:</h4>
            <ul>
              <li><a href="https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset" target="_blank" rel="noopener noreferrer">The Movies Dataset</a></li>
              <li><a href="https://www.kaggle.com/datasets/ashirwadsangwan/imdb-dataset" target="_blank" rel="noopener noreferrer">IMDB Dataset</a></li>
              <li><a href="https://www.kaggle.com/datasets/pushpakhinglaspure/oscar-dataset" target="_blank" rel="noopener noreferrer">Oscar Dataset</a></li>
              <li><a href="https://www.wikipedia.org/" target="_blank" rel="noopener noreferrer">Wikipedia</a></li>
            </ul>
          </div>
          
          <div className="footer-section creator">
            <p>
              Created by <a href="https://www.richardhenage.com" target="_blank" rel="noopener noreferrer">Richard Henage</a>
            </p>
            <p>
              Also check out <a href="https://www.elderchicken.com/games" target="_blank" rel="noopener noreferrer">Elder Chicken Games</a>
            </p>
          </div>
          
          <div className="footer-copyright">
            <p>&copy; {(new Date()).getFullYear()} CinemAlchemist</p>
          </div>
        </footer>
      </div>
    );
  }
}