import React from 'react';
import movieData from './data/movies_metadata.json';
import publicConfigurations from './data/public_configurations.json';
import header from './img/cinemalchemist-text.webp';
import background from './img/cinemalchemist-spilling-gold.webp';
// import movieData from './data/movies_metadata_sample.json';
console.time("init")

const PAGE_SIZE = 20

const primaryKey = "imdb_id"

const mostlyUnwatchedColumnWeights = [
  {"breakpoint": 0, "weight": 0},
  {"breakpoint": 2013, "weight": -0.1},
  {"breakpoint": 2017, "weight": -1},
  {"breakpoint": 2019, "weight": -3},
  {"breakpoint": 2020, "weight": -6},
  {"breakpoint": 2021, "weight": -12},
  {"breakpoint": 2022, "weight": -25},
  {"breakpoint": 2023, "weight": -50},
  {"breakpoint": 2024, "weight": -100}
]



// it's quantifiable if it's a number and it's clear that the higher the number, the better
/* 
 sorting methods for different types:
 when putting in a weight, can check a box to say "ban"
 number (budget):
  - weight to raw value
  - max or min value allowed
 genres:
  - individual weight to certain genres
 boolean (adult):
  - weight to true and false
 language:
  - just allow/disallow certain ones

  in general: 
  - allow various states to have different weights (positive, neutral, negative, banned)
  - for numbers, there need to be continuums (like the closer it is to x, the better)
  others: collection (show place in series and total number)
*/

// eslint-disable-next-line
String.prototype.replaceAt = function(index, replacement) {
  return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

const prepJSON = (string)=>{
  const matches = string.matchAll(/[^ {](')[^,}:]/gi)
  matches?.forEach(match=>{
    string = string.replaceAt(match.index+1, "`")
  })
  return string.replaceAll(`"`, "`").replaceAll(`'`, `"`)
}

const parseJSONArraySafe = (string)=>{
  try {
    const result = JSON.parse(prepJSON(string))
    if (Array.isArray(result)) {
      return result
    } else {
      return []
    }
  } catch (e) {
    return []
  }
}

const lowerToTitle = (string)=>{
  return string.split(" ").map(str=>str.slice(0,1).toUpperCase()+str.slice(1)).join(" ")
}

const afiTypes = [
  "animation",
  "courtroom_drama",
  "epic",
  "fantasy",
  "gangster",
  "mystery",
  "romantic_comedy",
  "science_fiction",
  "sports",
  "western",
  "musicals",
  "scores",
  "heroes",
  "villains",
  "cheers",
  "laughs",
  "passions",
  "quotes",
  "songs",
  "thrills",
].map(type=>`afi_${type}_rank`)

const Columns = {
  poster_path: {
    displayName: 'Image',
    quantifiable: false,
    weighable: false,
    type: "image",
  },
  title: {
    displayName: 'Title',
    quantifiable: false,
    weighable: false,
    type: "string",
    bold: true,
  },
  release_date: {
    displayName: 'Year',
    quantifiable: false,
    weighable: true,
    type: "number",
    date:true,
    subType: "ambiguous", // means that there may be specific target ranges that are desired, not just a high or low number
    defaultWeights: [
      {breakpoint: "lowest", weight: 3},
      {breakpoint: "highest", weight: 3},
    ],
  },
  watched: {
    displayName: 'Watched Year (or 0)',
    quantifiable: false,
    weighable: true,
    inPersonalSettings: true,
    type: "number",
    date:true,
    subType: "ambiguous", // means that there may be specific target ranges that are desired, not just a high or low number
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: 2013, weight: -0.1},
      {breakpoint: 2017, weight: -1},
      {breakpoint: 2019, weight: -3},
      {breakpoint: 2020, weight: -6},
      {breakpoint: 2021, weight: -12},
      {breakpoint: 2022, weight: -25},
      {breakpoint: 2023, weight: -50},
      {breakpoint: 2024, weight: -100},
    ],
  },
  runtime: {
    displayName: 'Runtime',
    quantifiable: false,
    weighable: true,
    type: "number",
    minutes:true,
    subType: "ambiguous", // means that there may be specific target ranges that are desired, not just a high or low number
    defaultWeights: [
      {breakpoint: "lowest", weight: 3},
      {breakpoint: "highest", weight: 3},
    ],
  },
  genres: {
    displayName: 'Genre',
    quantifiable: false,
    weighable: true,
    type: "list",
    subType: "enum",
    defaultWeights: [
    ],
  },
  // popularity: {
  //   displayName: 'Popularity',
  //   quantifiable: true,
  //   weighable: true,
  //   type: "number",
  // },
  vote_average: {
    displayName: 'Rating',
    quantifiable: true,
    weighable: true,
    type: "number",
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: 10, weight: 0.5},
    ],
  },
  vote_count: {
    displayName: 'Vote Count',
    quantifiable: true,
    weighable: true,
    type: "number",
    thousandsComma:true,
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 0.5},
    ],
  },
  vote_average_imdb: {
    displayName: 'IMdB Rating',
    quantifiable: true,
    weighable: true,
    type: "number",
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: 10, weight: 5},
    ],
  },
  vote_count_imdb: {
    displayName: 'IMdB Vote Count',
    quantifiable: true,
    weighable: true,
    type: "number",
    thousandsComma:true,
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 4},
    ],
  },
  oscar_wins: {
    displayName: 'Oscar Wins',
    quantifiable: true,
    weighable: true,
    type: "number",
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 3},
    ],
  },
  oscar_nominations: {
    displayName: 'Oscar Nominations',
    quantifiable: true,
    weighable: true,
    type: "number",
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 3},
    ],
  },
  nfr_induction_year: {
    displayName: 'NFR',
    quantifiable: false,
    weighable: true,
    type: "number",
    date:true,
    subType: "ambiguous", // means that there may be specific target ranges that are desired, not just a high or low number
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "lowest", weight: 3},
      {breakpoint: "highest", weight: 3},
    ],
  },
  afi_rank: {
    displayName: 'AFI',
    quantifiable: false,
    weighable: true,
    type: "number",
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "lowest", weight: 3},
      {breakpoint: "highest", weight: 2},
    ],
  },
  ...afiTypes.reduce((acc, propName)=>({...acc, [propName]: {
    displayName: 'AFI '+lowerToTitle(propName.replaceAll("afi_", "").replaceAll("_rank", "").replaceAll("_", " ")),
    quantifiable: false,
    weighable: true,
    type: "number",
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "lowest", weight: 3},
      {breakpoint: "highest", weight: 2},
    ],
  }}), {}),
  budget: {
    displayName: 'Budget',
    quantifiable: true,
    weighable: true,
    type: "number",
    thousandsComma:true,
    dollarSign:true,
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 3},
    ],
  },
  revenue: {
    displayName: 'Revenue',
    quantifiable: true,
    weighable: true,
    type: "number",
    thousandsComma:true,
    dollarSign:true,
    defaultWeights: [
      {breakpoint: 0, weight: 0},
      {breakpoint: "highest", weight: 3},
    ],
  },
  original_language: {
    displayName: 'Language',
    quantifiable: false,
    weighable: true,
    type: "string",
    subType: "enum",
    defaultWeights: [
    ],
  },
  production_companies: {
    displayName: 'Studios',
    quantifiable: false,
    weighable: true,
    type: "list",
    subType: "enum",
    defaultWeights: [
    ],
  },
  production_countries: {
    displayName: 'Countries',
    quantifiable: false,
    weighable: true,
    type: "list",
    subType: "enum",
    defaultWeights: [
    ],
  },
}
// localStorage.setItem("savedSettings", '{"columnWeights":{"release_date":[{"breakpoint":1,"weight":0},{"breakpoint":2020,"weight":0}],"runtime":[{"breakpoint":0,"weight":0},{"breakpoint":1256,"weight":0}],"genres":[],"vote_average":[{"breakpoint":0,"weight":0},{"breakpoint":10,"weight":1}],"vote_count":[{"breakpoint":0,"weight":0},{"breakpoint":14075,"weight":1}],"vote_average_imdb":[{"breakpoint":0,"weight":0},{"breakpoint":10,"weight":10}],"vote_count_imdb":[{"breakpoint":0,"weight":0},{"breakpoint":3000001,"weight":4}],"oscar_wins":[{"breakpoint":0,"weight":0},{"breakpoint":"highest","weight":6}],"oscar_nominations":[{"breakpoint":0,"weight":0},{"breakpoint":"highest,"weight":4}],"budget":[{"breakpoint":0,"weight":0},{"breakpoint":380000000,"weight":0}],"revenue":[{"breakpoint":0,"weight":0},{"breakpoint":1000000000,"weight":0},{"breakpoint":2787965087,"weight":0},{"breakpoint":100000000,"weight":0}],"original_language":[],"production_companies":[],"production_countries":[]}}')
// Object.entries(Columns).forEach(([columnName, columnInfo])=>{
//   console.log(`movieData.map(movie=>movie[columnName]):`, movieData.map(movie=>movie[columnName]))
//   if (columnInfo.quantifiable) {
//     // find the highest value of any movie in the dataset
//     const max = movieData.map(movie=>parseFloat(movie[columnName])).sort((a,b)=>b-a)[0]
//     console.log(`max = :`, max)
//     columnInfo.maxValue = max
//   }
// })

// const quantifiableColumnEntries = Object.entries(Columns).filter(([columnName, columnInfo])=>columnInfo.quantifiable)
// const unquantifiableColumnEntries = Object.entries(Columns).filter(([columnName, columnInfo])=>columnInfo.weighable&&!columnInfo.quantifiable)
const numberColumnEntries = Object.entries(Columns).filter(([columnName, columnInfo])=>columnInfo.type==="number")
const enumColumnEntries = Object.entries(Columns).filter(([columnName, columnInfo])=>columnInfo.type==="string"&&columnInfo.subType==="enum")
const listEnumColumnEntries = Object.entries(Columns).filter(([columnName, columnInfo])=>columnInfo.type==="list"&&columnInfo.subType==="enum")

numberColumnEntries.forEach(([columnName, columnInfo])=>{
  columnInfo.maxValue = -Infinity
  columnInfo.minValue = Infinity
});
([...enumColumnEntries, ...listEnumColumnEntries]).forEach(([columnName, columnInfo])=>{
  columnInfo.values = {}
})
console.timeEnd("init")

console.time("column values")
movieData.forEach(movie=>{
  numberColumnEntries.forEach(([columnName, columnInfo])=>{
    const value = parseFloat(movie[columnName])
    if (value > columnInfo.maxValue) {
      columnInfo.maxValue = value
    } else if (value < columnInfo.minValue) {
      columnInfo.minValue = value
    }
  })
  
  enumColumnEntries.forEach(([columnName, columnInfo])=>{
    const value = movie[columnName]
    columnInfo.values[value] = (columnInfo.values[value]||0) + 1
  })
  
  listEnumColumnEntries.forEach(([columnName, columnInfo])=>{
    parseJSONArraySafe(movie[columnName]).forEach(({name:value})=>{
      columnInfo.values[value] = (columnInfo.values[value]||0) + 1
    })
  })
})
console.log(`Columns:`, Columns)

const initialConfigurationId = crypto.randomUUID()
const DefaultSettings = {
  configurations: {
    [initialConfigurationId]: {
      columnWeights: structuredClone(Object.values(publicConfigurations)[0].columnWeights),
      displayName: "My Picks"
    }
  },
  currentConfigurationId: initialConfigurationId,
  movieSettings: {} // settings for individual movies, like watchlist or watched
  // columnWeights: {
  //   ...Object.entries(Columns).reduce((columnWeights, [colName, colInfo])=>{
  //     if (colInfo.weighable) {
  //       let weights = []
  //       colInfo.defaultWeights.forEach(({breakpoint, weight})=> {
  //         let key
  //         if (breakpoint==="highest") {
  //           key = colInfo.maxValue
  //         } else if (breakpoint==="lowest") {
  //           key = colInfo.minValue
  //         } else {
  //           key = breakpoint
  //         }
  //         weights.push({
  //           breakpoint: key,
  //           weight: weight
  //         })
  //       })
  //       columnWeights[colName] = weights
  //     }
  //     return columnWeights
  //   }, {}),
  // },
}
console.timeEnd("column values")


export default class List extends React.Component {
  constructor(props) {
    super(props);
    let savedSettings
    try {
      savedSettings = JSON.parse(localStorage.getItem('savedSettings'))
      savedSettings = {...DefaultSettings, ...savedSettings}
    } catch (e) {
      savedSettings = DefaultSettings
    }
    this.state = {
      savedSettings,
      pageNumber: 0,
      freezeListOrder: false,
      onlyUnsortedWatched: false,
      onlyUnwatched: false,
      mostlyUnwatched: false,
    }
  }
  saveSettings=(settings)=>{
    this.setState(({ savedSettings: prevSettings })=>{
      const newSettings = {...prevSettings, ...settings}
      localStorage.setItem('savedSettings', JSON.stringify(newSettings))
      return {
        savedSettings: newSettings
      }
    })
  }
  copyConfiguration=(configuration)=>{
    const newId = crypto.randomUUID()
    let newDisplayName = configuration.displayName
    const displayMatch = conf=>conf.displayName===newDisplayName
    do {
      const number = / \d+$/.exec(newDisplayName)?.[0]
      if (number) {
        newDisplayName = newDisplayName.replace(/ \d+$/, ` ${parseInt(number)+1}`)
      } else {
        newDisplayName = newDisplayName + " 2"
      }
    } while (Object.values({...publicConfigurations, ...this.state.savedSettings.configurations}).find(displayMatch))
    this.saveSettings({
      configurations: {...this.state.savedSettings.configurations, [newId]: {
        columnWeights: structuredClone(configuration.columnWeights), 
        displayName: newDisplayName,
      }},
      currentConfigurationId: newId,
    })
  }
  deleteConfiguration=()=>{
    const configurations = this.state.savedSettings.configurations
    delete configurations[this.state.savedSettings.currentConfigurationId]
    this.saveSettings({
      configurations,
      currentConfigurationId: Object.keys(configurations)[0] ?? Object.keys(publicConfigurations)[0],
    })
  }
  lastSort = {}
  sortMovies=({movieData, savedSettings, configuration})=>{
    if (this.state.freezeListOrder && this.lastSort.list) {
      return {
        didChange: false, 
        sortedList: this.lastSort.list
      };
    }

    const stringifiedSettings = JSON.stringify({savedSettings, configuration})
    if (this.lastSort.stringifiedSettings===stringifiedSettings) {
      return {
        didChange: false, 
        sortedList: this.lastSort.list
      };
    } else {
      const list = movieData.reduce((acc, movie, movieIndex) => {
        let sumValue = 0
        Object.entries(Columns).forEach(([columnName, columnInfo])=>{
          sumValue += getMovieValue({value:movie[columnName], primaryKey: movie[primaryKey], columnName, columnInfo, savedSettings, configuration})
          /* 
            To speed up:
            - don't do html for most of them
            - better sorting? maybe first check if they are better than the 25th best one.
          */
        })
        const row = {
          movieIndex,
          sumValue,
        }
        // use a binary search to find the right place to insert based on the sumValue
        let left = 0
        let right = acc.length
        while (left < right) {
          const mid = Math.floor((left + right) / 2)
          if (acc[mid].sumValue > sumValue) {
            left = mid + 1
          } else {
            right = mid
          }
        }
        // console.log(`left:`, left)
        acc.splice(left, 0, row)
        return acc
        // // use a binary search to find the right place to insert based on the sumValue
        // let lastIndex = Math.min(acc.length - 1, DISPLAYED_ROWS-1)
        // // console.log(`lastIndex:`, lastIndex)
        // if (acc[lastIndex]?.sumValue > sumValue && acc.length > DISPLAYED_ROWS) return acc; // no need to insert, it didn't make the cut
        // let left = 0
        // let right = lastIndex+1
        // while (left < right) {
        //   const mid = Math.floor((left + right) / 2)
        //   if (acc[mid].sumValue > sumValue) {
        //     left = mid + 1
        //   } else {
        //     right = mid
        //   }
        // }
        // // console.log(`left:`, left)
        // acc.splice(left, 0, row)
        // acc.splice(DISPLAYED_ROWS, 1)
        // return acc
      }, [])
      this.lastSort = {
        stringifiedSettings,
        list,
      }
      return {
        didChange: true, 
        sortedList: list
      };
    }
  }
  // shouldComponentUpdate (nextProps, nextState) {
  //   console.log(`JSON.stringify(nextProps):`, JSON.stringify(nextProps))
  //   console.log(`JSON.stringify(nextState):`, JSON.stringify(nextState))
  //   console.log(`JSON.stringify(this.state):`, JSON.stringify(this.state))
  //   console.log(`JSON.stringify(this.props):`, JSON.stringify(this.props))

  //   return true
  // }
  render() {
    console.time("render rows")
    const {pageNumber, savedSettings, freezeListOrder, onlyUnsortedWatched, onlyUnwatched, mostlyUnwatched} = this.state
    const isPublicConfiguration = savedSettings.currentConfigurationId in publicConfigurations
    const configuration = structuredClone(isPublicConfiguration ? publicConfigurations[savedSettings.currentConfigurationId] : savedSettings.configurations[savedSettings.currentConfigurationId])
    configuration.columnWeights = {...DefaultSettings.columnWeights, ...configuration.columnWeights} // if they were missing any columns, add them in
    if (mostlyUnwatched) {
      configuration.columnWeights = {
        ...configuration.columnWeights,
        watched: structuredClone(mostlyUnwatchedColumnWeights),
      }
    }
    const cleanseWatched = (dirtyConfiguration)=>{
      if (mostlyUnwatched) {
        if (JSON.stringify(dirtyConfiguration.columnWeights.watched)===JSON.stringify(mostlyUnwatchedColumnWeights)) {
          const realConfiguration = structuredClone(isPublicConfiguration ? publicConfigurations[savedSettings.currentConfigurationId] : savedSettings.configurations[savedSettings.currentConfigurationId])
          return {
            ...dirtyConfiguration, 
            columnWeights: {
              ...dirtyConfiguration.columnWeights,
              watched: realConfiguration.columnWeights.watched,
            }
          }
        }
      }
      return dirtyConfiguration
    }
    const saveConfiguration = (configuration)=>this.saveSettings({configurations: {...savedSettings.configurations, [savedSettings.currentConfigurationId]: cleanseWatched(configuration)}})
    // const DISPLAYED_ROWS = PAGE_SIZE * (pageNumber+1)
    const {didChange, sortedList} = this.sortMovies({movieData, savedSettings, configuration})
    if (didChange) {
      this.setState({pageNumber: 0})
    }
    console.timeEnd("render rows")

    return (
      <div className="container mt-5">
        <style>
          {`
            :root {
              --background-image: url('${background}');
            }
          `}
        </style>
        <img src={header} alt="CinemAlchemist" className="header-image" />
        {
        //   <header style={{ paddingLeft: 0 }}>
        //   <div
        //     className='p-5 text-center bg-image'
        //     style={{ backgroundImage: `url(${logo})`, height: 400 }}
        //     >
        //     <div className='mask' style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
        //       <div className='d-flex justify-content-center align-items-center h-100'>
        //         <div className='text-white'>
        //           <h1 className='mb-3'>CinemAlchemist</h1>
        //           <h4 className='mb-3'>Transforming Movie Preferences into Gold</h4>
        //           {/* <a className='btn btn-outline-light btn-lg' href='#column-weights' role='button'>
        //             Start now
        //           </a> */}
        //         </div>
        //       </div>
        //     </div>
        //   </div>
        // </header>
      }
        <br/>
        <br/>
        <p>
          Instructions: Adjust the settings in the Alchemy section below, then press Save. 
          View the resulting Gold List at the bottom.
        </p>
        <br />
        <ColumnWeights 
          configuration={configuration} 
          saveConfiguration={saveConfiguration} 
          copyConfiguration={configuration=>this.copyConfiguration(cleanseWatched(configuration))} 
          deleteConfiguration={this.deleteConfiguration} 
          isPublicConfiguration={isPublicConfiguration}
        />
        <div>
          <span>My Configurations: </span>
          {Object.entries(savedSettings.configurations).map(([id,conf])=>(
            <button onClick={()=>this.saveSettings({currentConfigurationId: id})} style={savedSettings.currentConfigurationId===id ? {filter: "invert(100%)"} : {}}>{conf.displayName}</button>
          ))}
        </div>
        <div>
          <span>Public Configurations: </span>
          {Object.entries(publicConfigurations).map(([id,conf])=>(
            <button onClick={()=>this.saveSettings({currentConfigurationId: id})} style={savedSettings.currentConfigurationId===id ? {filter: "invert(100%)"} : {}}>{conf.displayName}</button>
          ))}
        </div>
        <br />
        <br />
        <h3>Gold List</h3>
        <p>Instructions: If you want to keep track of when you have seen each movie, check the first two boxes (Freeze List Order and Only Unsorted Watched) while inputting the Year Watched. 
          {/* Then, you can move quickly through the movies by typing your year number, then pressing TAB. 
          Make sure to type 0 if you haven't seen the movie so it will remember that you haven't seen it, and not ask again. */}
        </p>
        <div>
          <input type="checkbox" value={freezeListOrder} onChange={(e)=>this.setState({freezeListOrder: !freezeListOrder})} />
          <span>Freeze List Order</span>
        </div>
        <div>
          <input type="checkbox" value={onlyUnsortedWatched} onChange={(e)=>this.setState({onlyUnsortedWatched: !onlyUnsortedWatched, pageNumber: 0})} />
          <span>Only Unsorted Watched</span>
        </div>
        <div>
          <input type="checkbox" value={onlyUnwatched} onChange={(e)=>this.setState({onlyUnwatched: !onlyUnwatched, pageNumber: 0})} />
          <span>Only Unwatched</span>
        </div>
        <div>
          <input type="checkbox" value={mostlyUnwatched} onChange={(e)=>this.setState({mostlyUnwatched: !mostlyUnwatched, pageNumber: 0})} />
          <span>Mostly Unwatched</span>
        </div>
        <div className="table-container">
          <table className="table">
            <thead className="sticky-top">
              <tr>
                {Object.entries(Columns).map(([columnName, columnInfo])=>{
                  return <th key={columnName}>{columnInfo.displayName}</th>
                })}
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {(
                onlyUnsortedWatched ? sortedList.filter(({movieIndex})=>isNaN(parseInt(savedSettings.movieSettings[movieData[movieIndex][primaryKey]]?.watched))) :
                onlyUnwatched ? sortedList.filter(({movieIndex})=>parseInt(savedSettings.movieSettings[movieData[movieIndex][primaryKey]]?.watched??0)===0) : 
                sortedList
              ).slice(PAGE_SIZE*pageNumber, PAGE_SIZE*(pageNumber+1)).map(({movieIndex, sumValue}) => (
                <MovieRow key={movieIndex} movie={movieData[movieIndex]} sumValue={sumValue} savedSettings={savedSettings} saveSettings={this.saveSettings} configuration={configuration} />
              ))}
            </tbody>
          </table>
        </div>
        <br/>
        <div>
          <button disabled={pageNumber<=0} onClick={()=>this.setState({pageNumber: pageNumber-1})}>←</button>
          <span>{pageNumber+1}</span>
          <button disabled={(pageNumber+1)*PAGE_SIZE >= movieData.length} onClick={()=>this.setState({pageNumber: pageNumber+1})}>→</button>
        </div>
        <br/>
        <br/>
        <p>
          Thanks to:
          <br/>
          <a href="https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset">https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset</a>,&nbsp;
          <a href="https://www.kaggle.com/datasets/ashirwadsangwan/imdb-dataset">https://www.kaggle.com/datasets/ashirwadsangwan/imdb-dataset</a>,&nbsp;
          <a href="https://www.kaggle.com/datasets/pushpakhinglaspure/oscar-dataset">https://www.kaggle.com/datasets/pushpakhinglaspure/oscar-dataset</a>, and&nbsp;
          <a href="https://www.wikipedia.org/">https://www.wikipedia.org/</a>
          {/* <a href="https://www.kaggle.com/datasets/andrezaza/clapper-massive-rotten-tomatoes-movies-and-reviews">https://www.kaggle.com/datasets/andrezaza/clapper-massive-rotten-tomatoes-movies-and-reviews</a>,  */}
          {/* <a href="https://www.kaggle.com/datasets/unanimad/golden-globe-awards">https://www.kaggle.com/datasets/unanimad/golden-globe-awards</a>,  */}
          {/* <a href="https://www.kaggle.com/datasets/unanimad/bafta-awards">https://www.kaggle.com/datasets/unanimad/bafta-awards</a> */}
        </p>
        <p>
          Created by <a href="https://www.richardhenage.com">Richard Henage</a>
        </p>
        <p>
          Also check out <a href="https://www.elderchicken.com/games">Elder Chicken Games</a>
        </p>
        <p>
          &copy; {(new Date()).getFullYear()}
        </p>
      </div>
    );
  }
}

class ColumnWeights extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      columnWeights: props.configuration.columnWeights,
      displayName: props.configuration.displayName,
    }
  }

  lastConfigurationProps
  componentDidUpdate() {
    const stringified = JSON.stringify(this.props.configuration)
    if (stringified !== this.lastConfigurationProps) {
      this.lastConfigurationProps = stringified
      const {columnWeights, displayName} = this.props.configuration
      this.setState({columnWeights, displayName})
    }
  }

  keyAddition = 0
  render() {
    const {columnWeights, displayName} = this.state
    if (!columnWeights) {
      return (<div>Loading configuration...</div>)
    }
    const {keyAddition} = this
    const {copyConfiguration, deleteConfiguration, isPublicConfiguration} = this.props
    const saveConfiguration = ({columnWeights, displayName})=>{
      Object.values(columnWeights).forEach(column=>column.forEach(columnWeight=>{
        columnWeight.breakpoint = !isNaN(parseFloat(columnWeight.breakpoint)) ? parseFloat(columnWeight.breakpoint) : columnWeight.breakpoint
        columnWeight.weight = parseFloat(columnWeight.weight)
      }))
      this.props.saveConfiguration({columnWeights, displayName})
    }
    return (<>
      <h3 id="column-weights">Alchemy</h3>
      <p>Instructions: For each pair, the first number is the "breakpoint" and the second number is the "weight". 
        {/* The movie's score in each column is set by how close it is to the two closest breakpoints, and what their weights are.
        You can add and remove breakpoints.
        If a movie's property falls outside the breakpoints, it is set exactly to the closest breakpoint.
        You can have a negative weight on a breakpoint if you want.
        For columns like Genre, you can add weights to each possible genre, positive or negative.
        You must click Save for the settings to be applied. */}
      </p>
      <div>
        <span>Name:</span>
        <input type="text" value={displayName} onChange={(e)=>this.setState({displayName:e.target.value})} disabled={isPublicConfiguration} />
      </div>
      <div className="table-container">
        <table>
          {Object.entries(columnWeights).map(([columnName, weights])=>{
            const add = () => {
              const breakpoint = (
                Columns[columnName].type==="number" ? Columns[columnName].maxValue :
                Object.keys(Columns[columnName].values??{})[0]??"Target"
              )
              columnWeights[columnName].push({breakpoint, weight: 3})
              this.keyAddition++
              this.setState({columnWeights})
            }
            return (
              <tr key={columnName}>
                <td style={{minWidth: "230px"}}>
                  <b className="me-5">{Columns[columnName].displayName}: </b>
                </td>
                {weights.map(({breakpoint, weight}, index)=>{
                  const update = (updates) => {
                    const prevData = columnWeights[columnName][index]
                    columnWeights[columnName][index] = {...prevData, ...updates}
                    this.setState({columnWeights})
                  }
                  const remove = () => {
                    columnWeights[columnName].splice(index, 1)
                    this.keyAddition++
                    this.setState({columnWeights})
                  }
                  return (
                    <td key={index+"_"+keyAddition} style={{minWidth: "230px"}}>
                      {Columns[columnName].subType==="enum" ? (
                        <select style={{width:"120px"}} value={breakpoint} onChange={(e)=>update({breakpoint: e.target.value})}>
                          {Object.entries(Columns[columnName].values).sort(([aKey,aVal],[bKey,bVal])=>bVal-aVal).map(([key,val])=>(
                            <option key={key} value={key}>{key}</option>
                          ))}
                        </select>
                      ) : (
                        <input style={{width:"120px"}} type={Columns[columnName].type==="number" ? "number" : "text"} value={breakpoint} onChange={(e)=>update({breakpoint: Columns[columnName].type==="number" ? parseFloat(e.target.value) : e.target.value})}/>
                      )}
                      <input style={{width:"60px"}} type="number" value={weight} onChange={(e)=>update({weight: e.target.value})}/>
                      <button onClick={remove}>x</button>
                    </td>
                  )
                })}
                <td>
                  <button onClick={add}>+</button>
                </td>
              </tr>
            )
          })}
        </table>
      </div>
      <button onClick={()=>saveConfiguration({columnWeights, displayName})} disabled={isPublicConfiguration}>Save</button>
      <button onClick={()=>copyConfiguration({columnWeights, displayName})}>Copy</button>
      {!isPublicConfiguration && (
        <DeleteButton onClick={()=>deleteConfiguration()} buttonText="Delete"/>
      )}
      <br />
      <br />
    </>)
  }
}

class MovieRow extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      overrideThisMovieSettings: {}, 
    }
  }

  render () {
    const {movie, savedSettings, saveSettings, configuration, sumValue} = this.props
    const thisMovieSettings = {...(savedSettings.movieSettings[movie[primaryKey]] || {}), ...this.state.overrideThisMovieSettings}
    const updateThisMovieSettings = (changes)=>{
      this.setState({overrideThisMovieSettings: {...this.state.overrideThisMovieSettings, ...changes}})
    }
    const saveThisMovieSettings = ()=>{
      saveSettings({movieSettings: {...savedSettings.movieSettings, [movie[primaryKey]]: thisMovieSettings}})
    }
    return (
      <tr key={movie.id}>
        {Object.entries(Columns).map(([columnName, columnInfo])=>{
          /* 
            To speed up:
            - don't do html for most of them
            - better sorting? maybe first check if they are better than the 25th best one.
          */
          const thisValue = getMovieValue({value: movie[columnName], primaryKey: movie[primaryKey], columnName, columnInfo, savedSettings, configuration})
          let displayVal
          if (columnInfo.inPersonalSettings) {
            // they can change the input in this row
            displayVal = (
              <input style={{width:"60px"}} type="number" value={thisMovieSettings[columnName]} onChange={(e)=>updateThisMovieSettings({[columnName]: e.target.value})} onBlur={saveThisMovieSettings} />
            )
          } else if (columnInfo.type === "list") {
            displayVal = parseJSONArraySafe(movie[columnName]).map(g=>g.name).sort().join(", ")
          } else if (columnInfo.date) {
            displayVal = (new Date(movie[columnName])).getFullYear()||0
          } else if (columnInfo.minutes) {
            displayVal = Math.floor(parseInt(movie[columnName])/60)+":"+(parseInt(movie[columnName])%60).toString().padStart(2, "0")
          } else if (columnInfo.type==="image") {
            displayVal = (
              <img src={"https://media.themoviedb.org/t/p/w94_and_h141_bestv2"+movie[columnName]} alt="" />
            )
          } else {
            displayVal = movie[columnName]
          }
          if (columnInfo.thousandsComma) {
            const str = parseInt(displayVal)+""
            let arr = []
            let index = str.length
            while (index > 0) {
              arr.unshift(str.slice(Math.max(index-3, 0), index))
              index -= 3
            }
            displayVal = arr.join(",")
          }
          if (columnInfo.dollarSign) {
            displayVal = "$"+displayVal
          }
          if (!sumValue?.toFixed) {
            console.log(`sumValue:`, sumValue, typeof sumValue)
          }
          return <td key={columnName} style={columnInfo.bold ? {fontWeight: "bold"} : {}}>
            <span>{displayVal}</span>
            {columnInfo.weighable && (<>
              <br/>
              <span>({parseFloat(thisValue.toFixed(2))})</span>
            </>)}
          </td>
        })}
        <td>{parseFloat(parseFloat(sumValue).toFixed(2))}</td>
      </tr>
    )
  }
}

const getMovieValue = ({value, primaryKey, columnName, columnInfo, savedSettings, configuration})=>{
  if (columnInfo.inPersonalSettings) {
    value = savedSettings.movieSettings[primaryKey]?.[columnName]
  }

  let thisValue
  if (!columnInfo.weighable) return 0;
  const weights = configuration.columnWeights[columnName]
  if (!weights.length) {
    thisValue = 0
  } else if (columnInfo.type==="string") {
    thisValue = parseFloat(weights.find(weight=>weight.breakpoint===value)?.weight) || 0
  } else if (columnInfo.type==="list") {
    thisValue = 0
    const entries = parseJSONArraySafe(value)
    weights.forEach(weight=>{
      if (entries.find(entry=>entry.name===weight.breakpoint)) {
        thisValue += parseFloat(weight.weight)
      }
    })
  } else if (columnInfo.type==="number") {
    let lowerWeight
    let higherWeight
    weights.forEach(weight=>{
      if (weight.breakpoint<=(parseFloat(value)??0) && weight.breakpoint>(lowerWeight?.breakpoint??-Infinity)) {
        lowerWeight = weight
      }
      if (weight.breakpoint>=(parseFloat(value)??0) && weight.breakpoint<(higherWeight?.breakpoint??Infinity)) {
        higherWeight = weight
      }
    })
    if (lowerWeight && higherWeight) {
      if (lowerWeight.weight===higherWeight.weight) {
        thisValue = parseFloat(lowerWeight.weight) // it doesn't matter which one
      } else {
        const percentHigh = ((parseFloat(value)??0) - lowerWeight.breakpoint) / (higherWeight.breakpoint - lowerWeight.breakpoint)
        thisValue = (parseFloat(higherWeight.weight) * percentHigh) + (parseFloat(lowerWeight.weight) * (1-percentHigh))
      }
    } else if (lowerWeight) {
      thisValue = parseFloat(lowerWeight.weight)
    } else if (higherWeight) {
      thisValue = parseFloat(higherWeight.weight)
    } else {
      thisValue = 0
    }
    // if (isNaN(thisValue)) {
    //   console.log(`thisValue:`, thisValue)
    //   console.log(`value:`, value)
    //   console.log(`lowerWeight:`, lowerWeight)
    //   console.log(`higherWeight:`, higherWeight)
    //   console.log(`weights:`, weights)
    //   console.log(`percentHigh:`, ((value??0) - lowerWeight.breakpoint) / (higherWeight.breakpoint - lowerWeight.breakpoint))
    // }
  }
  return thisValue || 0
}



export class DeleteButton extends React.Component {
  // a delete button with a confirmation message
  constructor(props) {
      super(props)
      this.state = {
          needsConfirmation: false
      }
  }
  confirmationTimeout = undefined
  render() { try {
      const {needsConfirmation} = this.state
      const {
        onClick:propsOnClick = ()=>{}, 
        // size = "tiny", 
        className:propsClassName = undefined, 
        containerClassName = "", 
        tooltipDirection = "left", 
        tooltipText = undefined, 
        // buttonType = "text", 
        buttonText = "Delete", 
        confirmationMessage = "confirm delete?"
      } = this.props
      const className = propsClassName ?? ""//`${size}-icon blue-bg deleteButton`
      const onClick = (e) => {
          e.stopPropagation()
          if (needsConfirmation) {
              clearTimeout(this.confirmationTimeout)
              this.setState({needsConfirmation: false})
              propsOnClick()
          } else {
              this.setState({needsConfirmation: true})
              this.confirmationTimeout = setTimeout(() => {
                  this.setState({needsConfirmation: false})
              }, 3000)
          }
      }
      let button;
      if (needsConfirmation) {
          button  = (
              <button
                  className="text-white bg-danger"
                  onClick={onClick}
              >{confirmationMessage}</button>)
      // } else if (buttonType === "icon") {
      //     button  = (
      //         <img 
      //             src={imagefolder+"/delete-icon-light.svg"} 
      //             alt="delete" 
      //             className={className}
      //             onClick={onClick}
      //         /> )
      } else {
          button  = (
              <button
                  className={className}
                  onClick={onClick}
              >{buttonText}</button>)
      }
      if (tooltipText) {
          return (
              <div className={"tooltip-container front-hover " + containerClassName}>
                  {button}
                  <div className={`${tooltipDirection} tooltip`}>{tooltipText}</div>
              </div> 
          )
      } else {
          return button
      }
  } catch (e) {
      console.error(e)
      return (<div>An error has occurred.</div>)
  }}
}