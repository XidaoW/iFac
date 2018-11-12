import React, { Component } from 'react';
import * as d3 from 'd3';
import Overview from 'components/Overview';
import PatternDetailView from 'components/PatternDetailView';
import InspectionView from 'components/InspectionView';

import styles from './styles.scss';
import factors_data from '../../data/sports_factors_3_20.json';
import gs from '../../config/_variables.scss'; // gs (=global style)

class App extends Component {
  constructor(props) {
		super(props);
		this.state = {
      factors_data: factors_data.data,
      descriptors: factors_data.descriptors,
      descriptors_mean: factors_data.average,
      descriptors_text: [],
      components_cnt:factors_data.data.length,
      modes:factors_data.modes,
      bar_data: [],
      mouseOveredPatternIdx: '',
      mouseOveredPatternData: {},
      selectedPatterns: [],
      currentSelectedPatternIdx:'',
      mostSimilarPatternToSelectedPatternIdx:[],
      leastSimilarPatternToSelectedPatternIdx:[]
		};
    this.handleClickPattern = this.handleClickPattern.bind(this);
    this.handleUnClickPattern = this.handleUnClickPattern.bind(this);
    this.handleMouseOverPattern = this.handleMouseOverPattern.bind(this);
    this.handleMouseOutPattern = this.handleMouseOutPattern.bind(this);

	}

  handleMouseOverPattern(idx){
    const { factors_data } = this.state;
    const newMouseOverPatternIdx = idx;
    console.log('mouseovered id: ', factors_data);
    console.log('mouseovered id: ', idx);

    this.setState(prevState => ({
      mouseOverPattern: newMouseOverPatternIdx,
      mouseOveredPatternData: factors_data[idx]
    }));

  }
  handleMouseOutPattern(id){
    this.setState(prevState => ({
      mouseOverPattern: ''
    }));
  }

  handleClickPattern(idx) { 
    const newSelectedPattern = idx;
    console.log('clicked id: ', idx);
    var mostSimilarPattern = []
    // update the petal width to match the similarity of the selected patterns.
    const factors = factors_data.data;
    factors.forEach(function(d, id) {
      d.petals = d3.range(d.dims).map(function(i) { 
        // larger entropy, less concentrated descritors
        // close to 0, more concentrated descriptors
        return {id: id, length: 1 - d.factors[i].entropy,
            width: d.factors[i].similarity[idx]}; 
      });
      d.circles = {dominance: d.weight, radius: 6};     
      d.x = (d.tsne_coord.x - d.min_tsne[0]) * 450 / (d.max_tsne[0] - d.min_tsne[0]) + 100;
      d.y = (d.tsne_coord.y - d.min_tsne[1]) * 300 / (d.max_tsne[1] - d.min_tsne[1]) + 100;
    });

    // add the most and least similar pattern idx;
    var max_ids = [];
    var min_ids = [];
    for(var i = 0; i < factors_data.data[0].dims; i++){
      max_ids.push(factors[idx].factors[i].similarity.max_idx);
      min_ids.push(factors[idx].factors[i].similarity.min_idx);
    }

    this.setState(prevState => ({
      selectedPatterns: [...prevState.selectedPatterns, newSelectedPattern],
      currentSelectedPatternIdx: newSelectedPattern
    }));
    
    this.setState({
      factors_data: factors_data.data,
      mostSimilarPatternToSelectedPatternIdx: max_ids,
      leastSimilarPatternToSelectedPatternIdx: min_ids
    });
  }

  handleUnClickPattern(id) {
    const newSelectedPattern = id;
    const factors = factors_data.data;

    factors.forEach(function(d, id) {
      d.petals = d3.range(d.dims).map(function(i) { 
        // larger entropy, less concentrated descritors
        // close to 0, more concentrated descriptors
        return {id: id, length: 1 - d.factors[i].entropy,
            width: d.factors[i].similarity.average}; 
      });
      d.circles = {dominance: d.weight, radius: 6};     
      d.x = (d.tsne_coord.x - d.min_tsne[0]) * 450 / (d.max_tsne[0] - d.min_tsne[0]) + 100;
      d.y = (d.tsne_coord.y - d.min_tsne[1]) * 300 / (d.max_tsne[1] - d.min_tsne[1]) + 100;
    });

    this.setState(prevState => ({
      selectedPatterns: prevState.selectedPatterns.filter((d) => d !== newSelectedPattern),
      currentSelectedPatternIdx: ''
    }));
    
    this.setState({
      factors_data: factors_data.data,
    });

  }

  // Being called before rendering (preparing data to pass it to children)
	componentWillMount() {
    const _self = this;
    const factors = factors_data.data;
    var bar_data = {};
    factors.forEach(function(d, id) {
      d.petals = d3.range(d.dims).map(function(i) { 
        // larger entropy, less concentrated descritors
        // close to 0, more concentrated descriptors
        return {id: id, length: 1 - d.factors[i].entropy,
            width: d.factors[i].similarity.average}; 
      });
      d.circles = {dominance: d.weight, radius: 6};     
      d.x = (d.tsne_coord.x - d.min_tsne[0]) * 450 / (d.max_tsne[0] - d.min_tsne[0]) + 100;
      d.y = (d.tsne_coord.y - d.min_tsne[1]) * 300 / (d.max_tsne[1] - d.min_tsne[1]) + 100;
    });
    
    for(var i = 0; i < factors_data.data[0].dims; i++){
      bar_data[i] = []
      var pattern_cnt = factors_data.data.length;
      for(var j = 0; j < pattern_cnt; j++) {
        bar_data[i].push(factors_data.data[j].factors[i].values); 
      }      
      bar_data[i].push(factors_data.average[i]); 
    }
    
    var descriptors_text = [];
    for (var key in factors_data.descriptors) {
        if (factors_data.descriptors.hasOwnProperty(key)) {
            descriptors_text.push(key + "(" + factors_data.descriptors[key].length + ")");
        }
    }

    this.setState({
      descriptors: factors_data.descriptors,
      factors_data: factors_data.data,
      descriptors_text: descriptors_text,
      bar_data: bar_data,      
      descriptors_mean: factors_data.average,
      components_cnt:factors_data.data.length,
      modes: factors_data.modes
    });    
  }


  
  render() {
    if (!this.state.bar_data || this.state.bar_data.length === 0)
      return <div />

    const { factors_data, bar_data, descriptors_mean, components_cnt,
      selectedPatterns, mouseOveredPattern, modes,
      mostSimilarPatternToSelectedPatternIdx,leastSimilarPatternToSelectedPatternIdx,
      descriptors,descriptors_text
       } = this.state;
    console.log(factors_data);
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Tensor Pattern Exploration</h1>
        </header>
        <div className={styles.wrapper}>
          <div>
            <Overview 
              data={factors_data}
              onClickPattern={this.handleClickPattern}
              onUnClickPattern={this.handleUnClickPattern}
              onMouseOverPattern={this.handleMouseOverPattern}
              onMouseOutPattern={this.handleMouseOutPattern}            
              selectedPatterns={selectedPatterns}
              leastSimilarPatternToSelectedPatternIdx={leastSimilarPatternToSelectedPatternIdx}              
              mostSimilarPatternToSelectedPatternIdx={mostSimilarPatternToSelectedPatternIdx}
            />
            <div>#Patterns: {this.state.factors_data.length}</div>
            <div>#Descriptors: {descriptors_text.join(", ")}</div>

            <InspectionView 
              mouseOveredPattern={this.state.mouseOveredPatternData} 
              data = {factors_data}              
              mouseOveredPatternIdx={this.state.mouseOverPattern}
            />
          </div>
          <PatternDetailView 
            data={bar_data}                  
            selectedPatterns={selectedPatterns}
            components_cnt={components_cnt}
            modes={modes}
          />
        </div>
        
      </div>
    );
  }
}

export default App;
