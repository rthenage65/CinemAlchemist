import React from 'react';
import DeleteButton from './DeleteButton';

class ColumnWeights extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      columnWeights: props.configuration.columnWeights,
      displayName: props.configuration.displayName,
      isExpanded: false,
    };
  }

  lastConfigurationProps;
  componentDidUpdate() {
    const stringified = JSON.stringify(this.props.configuration);
    if (stringified !== this.lastConfigurationProps) {
      this.lastConfigurationProps = stringified;
      const {columnWeights, displayName} = this.props.configuration;
      this.setState({columnWeights, displayName});
    }
  }

  keyAddition = 0;
  render() {
    const {columnWeights, displayName} = this.state;
    if (!columnWeights) {
      return (<div>Loading configuration...</div>);
    }
    const {keyAddition} = this;
    const {copyConfiguration, deleteConfiguration, isPublicConfiguration, Columns} = this.props;
    const saveConfiguration = ({columnWeights, displayName}) => {
      Object.values(columnWeights).forEach(column=>column.forEach(columnWeight => {
        columnWeight.breakpoint = !isNaN(parseFloat(columnWeight.breakpoint)) ? parseFloat(columnWeight.breakpoint) : columnWeight.breakpoint;
        columnWeight.weight = parseFloat(columnWeight.weight);
      }));
      this.props.saveConfiguration({columnWeights, displayName});
    };
    const { isExpanded } = this.state;
    
    return (
      <div className="column-weights-container">
        <div className="collapsible-header" onClick={() => this.setState({ isExpanded: !isExpanded })}>
          <h3 id="column-weights">Alchemy</h3>
          <button className="toggle-button">
            {isExpanded ? '▼ Hide' : '► Show'}
          </button>
        </div>
        
        {isExpanded && (
          <>
            <p className="instructions">
              Instructions: For each pair, the first number is the "breakpoint" and the second number is the "weight". 
              {/* The movie's score in each column is set by how close it is to the two closest breakpoints, and what their weights are.
              You can add and remove breakpoints.
              If a movie's property falls outside the breakpoints, it is set exactly to the closest breakpoint.
              You can have a negative weight on a breakpoint if you want.
              For columns like Genre, you can add weights to each possible genre, positive or negative.
              You must click Save for the settings to be applied. */}
            </p>
            <div className="configuration-name">
              <label htmlFor="config-name">Configuration Name:</label>
              <input 
                id="config-name"
                type="text" 
                value={displayName} 
                onChange={(e)=>this.setState({displayName:e.target.value})} 
                disabled={isPublicConfiguration} 
                className="config-name-input"
              />
            </div>
            <div className="table-container">
              <table className="column-weights-table">
          {Object.entries(columnWeights).map(([columnName, weights]) => {
            const add = () => {
              const breakpoint = (
                Columns[columnName].type==="number" ? Columns[columnName].maxValue :
                Object.keys(Columns[columnName].values??{})[0]??"Target"
              );
              columnWeights[columnName].push({breakpoint, weight: 3});
              this.keyAddition++;
              this.setState({columnWeights});
            };
            return (
              <tr key={columnName}>
                <td style={{minWidth: "230px"}}>
                  <b className="me-5">{Columns[columnName].displayName}: </b>
                </td>
                {weights.map(({breakpoint, weight}, index) => {
                  const update = (updates) => {
                    const prevData = columnWeights[columnName][index];
                    columnWeights[columnName][index] = {...prevData, ...updates};
                    this.setState({columnWeights});
                  };
                  const remove = () => {
                    columnWeights[columnName].splice(index, 1);
                    this.keyAddition++;
                    this.setState({columnWeights});
                  };
                  return (
                    <td key={index+"_"+keyAddition} className="weight-control-cell">
                      <div className="weight-control">
                        {Columns[columnName].subType==="enum" ? (
                          <select className="breakpoint-select" value={breakpoint} onChange={(e)=>update({breakpoint: e.target.value})}>
                            {Object.entries(Columns[columnName].values).sort(([aKey,aVal],[bKey,bVal])=>bVal-aVal).map(([key,val])=>(
                              <option key={key} value={key}>{key}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="breakpoint-input"
                            type={Columns[columnName].type==="number" ? "number" : "text"} 
                            value={breakpoint} 
                            onChange={(e)=>update({breakpoint: Columns[columnName].type==="number" ? parseFloat(e.target.value) : e.target.value})}
                          />
                        )}
                        <input
                          className="weight-input"
                          type="number" 
                          value={weight} 
                          onChange={(e)=>update({weight: e.target.value})}
                        />
                        <button className="remove-button" onClick={remove}>×</button>
                      </div>
                    </td>
                  );
                })}
                <td>
                  <button onClick={add}>+</button>
                </td>
              </tr>
            );
          })}
        </table>
      </div>
      {isExpanded && (
        <div className="button-group">
          <button 
            className="save-button" 
            onClick={()=>saveConfiguration({columnWeights, displayName})} 
            disabled={isPublicConfiguration}
          >
            Save
          </button>
          <button 
            className="copy-button" 
            onClick={()=>copyConfiguration({columnWeights, displayName})}
          >
            Copy
          </button>
          {!isPublicConfiguration && (
            <DeleteButton onClick={()=>deleteConfiguration()} buttonText="Delete" className="delete-button"/>
          )}
        </div>
      )}
      </>)}
    </div>);
  }
}

export default ColumnWeights;