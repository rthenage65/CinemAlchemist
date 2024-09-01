import React from 'react';
import movieData from './data/movies_metadata.json';
// import movieData from './data/movies_metadata_sample.json';
console.time("init")

const PAGE_SIZE = 20

const primaryKey = "imdb_id"



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

const DefaultSettings = {
  columnWeights: {
    ...Object.entries(Columns).reduce((columnWeights, [colName, colInfo])=>{
      if (colInfo.weighable) {
        let weights = []
        colInfo.defaultWeights.forEach(({breakpoint, weight})=> {
          let key
          if (breakpoint==="highest") {
            key = colInfo.maxValue
          } else if (breakpoint==="lowest") {
            key = colInfo.minValue
          } else {
            key = breakpoint
          }
          weights.push({
            breakpoint: key,
            weight: weight
          })
        })
        columnWeights[colName] = weights
      }
      return columnWeights
    }, {}),
  },
  movieSettings: {} // settings for individual movies, like watchlist or watched
}
console.timeEnd("column values")


export default class List extends React.Component {
  constructor(props) {
    super(props);
    let savedSettings
    try {
      savedSettings = JSON.parse(localStorage.getItem('savedSettings'))
      savedSettings = {...DefaultSettings, ...savedSettings}
      savedSettings.columnWeights = {...DefaultSettings.columnWeights, ...savedSettings.columnWeights} // if they were missing any columns, add them in
    } catch (e) {
      savedSettings = DefaultSettings
    }
    this.state = {
      savedSettings,
      pageNumber: 0,
      freezeListOrder: false,
      onlyUnsortedWatched: false,
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
  lastSort = {}
  sortMovies=({movieData, savedSettings})=>{
    if (this.state.freezeListOrder && this.lastSort.list) return this.lastSort.list;

    const stringifiedSettings = JSON.stringify(savedSettings)
    if (this.lastSort.stringifiedSettings===stringifiedSettings) {
      return this.lastSort.list
    } else {
      const list = movieData.reduce((acc, movie, movieIndex) => {
        let sumValue = 0
        Object.entries(Columns).forEach(([columnName, columnInfo])=>{
          sumValue += getMovieValue({value:movie[columnName], primaryKey: movie[primaryKey], columnName, columnInfo, savedSettings})
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
      return list
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
    const {pageNumber, savedSettings, freezeListOrder, onlyUnsortedWatched} = this.state
    // const DISPLAYED_ROWS = PAGE_SIZE * (pageNumber+1)
    const sortedList = this.sortMovies({movieData, savedSettings})
    console.timeEnd("render rows")

    return (
      <div className="container mt-5">
        <h1>Movie Ratings</h1>
        <p>
          Instructions: Adjust the settings in these blue rectangles below, then press Save. 
          View the recommended movies list at the bottom. 
          You can enter what year you saw each movie. 
          Then, these movies' scores will be lowered if you saw them recently. 
          Your settings and Year Watched information will be saved to your browser.
        </p>
        <ColumnWeights columnWeights={savedSettings.columnWeights} saveSettings={this.saveSettings}/>
        <h3>Movie List</h3>
        <p>Instructions: If you want to keep track of when you have seen each movie, you will probably want to check both of the below boxes (Freeze List Order and Only Unsorted Watched) while inputting the Year Watched. 
          Then, you can move quickly through the movies by typing your year number, then pressing TAB. 
          Make sure to type 0 if you haven't seen the movie so it will remember that you haven't seen it, and not ask again.
        </p>
        <div>
          <input type="checkbox" value={freezeListOrder} onChange={(e)=>this.setState({freezeListOrder: !freezeListOrder})} />
          <span>Freeze List Order</span>
        </div>
        <div>
          <input type="checkbox" value={onlyUnsortedWatched} onChange={(e)=>this.setState({onlyUnsortedWatched: !onlyUnsortedWatched})} />
          <span>Only Unsorted Watched</span>
        </div>
        <table className="table">
          <thead className="sticky-top bg-light">
            <tr>
              {Object.entries(Columns).map(([columnName, columnInfo])=>{
                return <th key={columnName}>{columnInfo.displayName}</th>
              })}
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {(
              onlyUnsortedWatched ? sortedList.filter(({movieIndex})=>isNaN(parseInt(savedSettings.movieSettings[movieData[movieIndex][primaryKey]]?.watched))) : sortedList
            ).slice(PAGE_SIZE*pageNumber, PAGE_SIZE*(pageNumber+1)).map(({movieIndex, sumValue}) => (
              <MovieRow key={movieIndex} movie={movieData[movieIndex]} sumValue={sumValue} savedSettings={savedSettings} saveSettings={this.saveSettings} />
            ))}
            <tr>
              <td colSpan={100}>
                <button disabled={pageNumber<=0} onClick={()=>this.setState({pageNumber: pageNumber-1})}>←</button>
                <span>{pageNumber+1}</span>
                <button disabled={(pageNumber+1)*PAGE_SIZE >= movieData.length} onClick={()=>this.setState({pageNumber: pageNumber+1})}>→</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p>Thanks to:</p>
        <a href="https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset">https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset</a>, 
        <a href="https://www.kaggle.com/datasets/ashirwadsangwan/imdb-dataset">https://www.kaggle.com/datasets/ashirwadsangwan/imdb-dataset</a>, 
        <a href="https://www.kaggle.com/datasets/pushpakhinglaspure/oscar-dataset">https://www.kaggle.com/datasets/pushpakhinglaspure/oscar-dataset</a>, and
        <a href="https://www.wikipedia.org/">https://www.wikipedia.org/</a>
        {/* <a href="https://www.kaggle.com/datasets/andrezaza/clapper-massive-rotten-tomatoes-movies-and-reviews">https://www.kaggle.com/datasets/andrezaza/clapper-massive-rotten-tomatoes-movies-and-reviews</a>,  */}
        {/* <a href="https://www.kaggle.com/datasets/unanimad/golden-globe-awards">https://www.kaggle.com/datasets/unanimad/golden-globe-awards</a>,  */}
        {/* <a href="https://www.kaggle.com/datasets/unanimad/bafta-awards">https://www.kaggle.com/datasets/unanimad/bafta-awards</a> */}
      </div>
    );
  }
}

class ColumnWeights extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      columnWeights: props.columnWeights,
    }
  }

  keyAddition = 0
  render() {
    const {columnWeights} = this.state
    const {keyAddition} = this
    const saveSettings = ({columnWeights})=>{
      Object.values(columnWeights).forEach(column=>column.forEach(columnWeight=>{
        columnWeight.breakpoint = !isNaN(parseFloat(columnWeight.breakpoint)) ? parseFloat(columnWeight.breakpoint) : columnWeight.breakpoint
        columnWeight.weight = parseFloat(columnWeight.weight)
      }))
      this.props.saveSettings({columnWeights})
    }
    return (<>
      <h3>Column Weights</h3>
      <p>Instructions: For each pair, the first number is the "breakpoint" and the second number is the "weight". 
        The movie's score in each column is set by how close it is to the two closest breakpoints, and what their weights are.
        You can add and remove breakpoints.
        If a movie's property falls outside the breakpoints, it is set exactly to the closest breakpoint.
        You can have a negative weight on a breakpoint if you want.
        For columns like Genre, you can add weights to each possible genre, positive or negative.
        You must click Save for the settings to be applied.
      </p>
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
          <div key={columnName} className="mb-2">
            <b className="me-5">{Columns[columnName].displayName}: </b>
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
                <span key={index+"_"+keyAddition} className="p-2 me-4 bg-info d-inline-block">
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
                </span>
              )
            })}
            <button onClick={add}>+</button>
          </div>
        )
      })}
      <br />
      <button onClick={()=>saveSettings({columnWeights})}>Save</button>
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
    const {movie, savedSettings, saveSettings, sumValue} = this.props
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
          const thisValue = getMovieValue({value: movie[columnName], primaryKey: movie[primaryKey], columnName, columnInfo, savedSettings})
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
          return <td key={columnName}>
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

const getMovieValue = ({value, primaryKey, columnName, columnInfo, savedSettings})=>{
  if (columnInfo.inPersonalSettings) {
    value = savedSettings.movieSettings[primaryKey]?.[columnName]
  }

  let thisValue
  if (!columnInfo.weighable) return 0;
  const weights = savedSettings.columnWeights[columnName]
  if (!weights.length) {
    thisValue = 0
  } else if (columnInfo.type==="string") {
    thisValue = weights.find(weight=>weight.breakpoint===value)?.weight || 0
  } else if (columnInfo.type==="list") {
    thisValue = 0
    const entries = parseJSONArraySafe(value)
    weights.forEach(weight=>{
      if (entries.find(entry=>entry.name===weight.breakpoint)) {
        thisValue += weight.weight
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
        thisValue = lowerWeight.weight // it doesn't matter which one
      } else {
        const percentHigh = ((parseFloat(value)??0) - lowerWeight.breakpoint) / (higherWeight.breakpoint - lowerWeight.breakpoint)
        thisValue = (higherWeight.weight * percentHigh) + (lowerWeight.weight * (1-percentHigh))
      }
    } else if (lowerWeight) {
      thisValue = lowerWeight.weight
    } else if (higherWeight) {
      thisValue = higherWeight.weight
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