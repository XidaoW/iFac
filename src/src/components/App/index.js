import React, { Component } from 'react';
// import Vis1 from 'components/Vis1';
import * as d3 from 'd3';
import Overview from 'components/Overview';
import PatternDetailView from 'components/PatternDetailView';

import styles from './styles.scss';
import factors_data from '../../data/factors.json';
import gs from '../../config/_variables.scss'; // gs (=global style)

class App extends Component {
  constructor(props) {
		super(props);

		this.state = {
      factors_data: factors_data,
      bar_data: [],
      selectedPatterns: []
		};
    this.handleClickPattern = this.handleClickPattern.bind(this);
    this.handleUnClickPattern = this.handleUnClickPattern.bind(this);
	}


  handleClickPattern(id) { 
    const newSelectedPattern = id;

    this.setState(prevState => ({
      selectedPatterns: [...prevState.selectedPatterns, newSelectedPattern]
    }));
  }

  handleUnClickPattern(id) {
    const newSelectedPattern = id;

    this.setState(prevState => ({
      selectedPatterns: prevState.selectedPatterns.filter((d) => d !== newSelectedPattern)
    }));
  }

  // Being called before rendering (preparing data to pass it to children)
	componentWillMount() {
    const _self = this;
    const factors = factors_data;
    var bar_data = {};
    
    factors.forEach(function(d) {
      d.petals = d3.range(d.dims).map(function(i) { 
        return {length: d.factors[i].entropy,
            width: d.factors[i].similarity.average}; 
      });
      d.circles = {dominance: d.weight, radius: 6};     
      d.x = (d.tsne_coord.x - d.min_tsne[0]) * 450 / (d.max_tsne[0] - d.min_tsne[0]) + 100;
      d.y = (d.tsne_coord.y - d.min_tsne[1]) * 300 / (d.max_tsne[1] - d.min_tsne[1]) + 100;
    });

    
    for(var i = 0; i < factors_data[0].dims; i++){
      bar_data[i] = []
      var pattern_cnt = factors_data.length;
      // var pattern_cnt = 3;
      for(var j = 0; j < pattern_cnt; j++) {
        bar_data[i].push(factors_data[j].factors[i].values); 
      }      
    }

    this.setState({
      factors_data: factors_data,
      bar_data: bar_data
    });    
  }
  
  render() {
    if (!this.state.bar_data || this.state.bar_data.length === 0)
      return <div />

    const { factors_data, bar_data, selectedPatterns } = this.state;

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Tensor Pattern Exploration</h1>
        </header>
        <div className={styles.wrapper}>
          <Overview 
            data={factors_data}
            onClickPattern={this.handleClickPattern}
            onUnClickPattern={this.handleUnClickPattern}
            selectedPatterns={selectedPatterns}
          />
          <PatternDetailView 
            data={bar_data}                                 
            selectedPatterns={selectedPatterns}
          />
        </div>
        
      </div>
    );
  }
}

export default App;
