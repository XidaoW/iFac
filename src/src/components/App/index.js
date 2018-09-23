import React, { Component } from 'react';
// import Vis1 from 'components/Vis1';
import Overview from 'components/Overview';

import './styles.scss';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Tensor Pattern Exploration</h1>
        </header>
        <p className="App-intro">
        </p>
        <Overview />
      </div>
    );
  }
}

export default App;
