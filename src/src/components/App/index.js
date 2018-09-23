import React, { Component } from 'react';
// import Vis1 from 'components/Vis1';
import Overview from 'components/Overview';

import './styles.scss';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Welcome to React. This is a test</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <Overview />
      </div>
    );
  }
}

export default App;
