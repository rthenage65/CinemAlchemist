// Utility functions for handling movie data

export const parseJSONArraySafe = (string) => {
  try {
    const result = JSON.parse(prepJSON(string));
    if (Array.isArray(result)) {
      return result;
    } else {
      return [];
    }
  } catch (e) {
    return [];
  }
};

export const prepJSON = (string) => {
  const matches = string.matchAll(/[^ {](')[^,}:]/gi);
  matches?.forEach(match => {
    string = string.replaceAt(match.index+1, "`");
  });
  return string.replaceAll(`"`, "`").replaceAll(`'`, `"`);
};

export const lowerToTitle = (string) => {
  return string.split(" ").map(str => str.slice(0,1).toUpperCase()+str.slice(1)).join(" ");
};

export const getMovieValue = ({value, primaryKey, columnName, columnInfo, savedSettings, configuration}) => {
  if (columnInfo.inPersonalSettings) {
    value = savedSettings.movieSettings[primaryKey]?.[columnName];
  }

  let thisValue;
  if (!columnInfo.weighable) return 0;
  const weights = configuration.columnWeights[columnName];
  if (!weights.length) {
    thisValue = 0;
  } else if (columnInfo.type==="string") {
    thisValue = parseFloat(weights.find(weight=>weight.breakpoint===value)?.weight) || 0;
  } else if (columnInfo.type==="list") {
    thisValue = 0;
    const entries = parseJSONArraySafe(value);
    weights.forEach(weight => {
      if (entries.find(entry=>entry.name===weight.breakpoint)) {
        thisValue += parseFloat(weight.weight);
      }
    });
  } else if (columnInfo.type==="number") {
    let lowerWeight;
    let higherWeight;
    weights.forEach(weight => {
      if (weight.breakpoint<=(parseFloat(value)??0) && weight.breakpoint>(lowerWeight?.breakpoint??-Infinity)) {
        lowerWeight = weight;
      }
      if (weight.breakpoint>=(parseFloat(value)??0) && weight.breakpoint<(higherWeight?.breakpoint??Infinity)) {
        higherWeight = weight;
      }
    });
    if (lowerWeight && higherWeight) {
      if (lowerWeight.weight===higherWeight.weight) {
        thisValue = parseFloat(lowerWeight.weight); // it doesn't matter which one
      } else {
        const percentHigh = ((parseFloat(value)??0) - lowerWeight.breakpoint) / (higherWeight.breakpoint - lowerWeight.breakpoint);
        thisValue = (parseFloat(higherWeight.weight) * percentHigh) + (parseFloat(lowerWeight.weight) * (1-percentHigh));
      }
    } else if (lowerWeight) {
      thisValue = parseFloat(lowerWeight.weight);
    } else if (higherWeight) {
      thisValue = parseFloat(higherWeight.weight);
    } else {
      thisValue = 0;
    }
  }
  return thisValue || 0;
};