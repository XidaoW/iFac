import React, { Component } from 'react';
// import Vis1 from 'components/Vis1';
import * as d3 from 'd3';
import Overview from 'components/Overview';
import PatternDetailView from 'components/PatternDetailView';

import './styles.scss';

import factors_data from '../../data/factors.json';
import bar_data from '../../data/data.csv';

class App extends Component {
  constructor(props) {
		super(props);

		this.state = {
      factors_data: factors_data,
      bar_data: []
		};
	}

  // Being called before rendering (preparing data to pass it to children)
	componentWillMount() {
    const _self = this;
		const factors = factors_data;

    // Update factors data
		factors.forEach(function(d) {
      d.petals = d3.range(d.dims).map(function(i) { 
        return {length: d.factors[i].entropy,
            width: d.factors[i].similarity.average}; 
      });
			d.circles = {dominance: d.weight, radius: 10};			
			d.x = (d.tsne_coord.x - d.min_tsne[0]) * 650 / (d.max_tsne[0] - d.min_tsne[0]) + 100;
			d.y = (d.tsne_coord.y - d.min_tsne[1]) * 400 / (d.max_tsne[1] - d.min_tsne[1]) + 100;
    });

		this.setState({
			factors_data: factors_data
    });
    
    // Read bar data
		d3.csv(bar_data).then(function(data){
      data.forEach(function(d, columns) {
        for (var i = 1, n = columns.length; i < n; ++i) 
          d[columns[i]] = +d[columns[i]];		
        return d
      });

			_self.setState({
				bar_data: data
			});
		});
  }
  
  render() {
    if (!this.state.bar_data || this.state.bar_data.length === 0 )
      return <div />

    const { factors_data, bar_data } = this.state;

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Tensor Pattern Exploration</h1>
        </header>
        <p className="App-intro">Overview</p>
        <Overview data={factors_data}/>
        <div className="App-chart-container">
          <PatternDetailView data={factors_data}/>
        </div>        
      </div>
    );
  }
}

export default App;
