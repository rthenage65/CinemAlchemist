import React from 'react';
import List from './List';

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  // urlParams = urlParamsAsObj();
  urlPath = window.location.pathname;

  render () {
    // https://splinteredsymmetry.com/play?test=1
    const { /* urlParams, */ urlPath } =  this;
    // const room = urlPath.match(/^\/room\/([0-9]+)/i);
    
    if(urlPath.toLowerCase() === "/") {
      return (<List />)
    } else {
      return (<List />)
    }
  }
}
  
// function urlParamsAsObj() {
//   const urlParamsString = window.location.search.substr(1);
//   const keyValueStrings = urlParamsString.split("&");
//   const urlParams = keyValueStrings.reduce((acc, cur)=>{
//       const [ key, value ] = cur.split('=');
//       acc[key] = value;
//       return acc;
//   }, {})
//   return urlParams;
// }