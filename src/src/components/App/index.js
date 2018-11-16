import React, { Component } from 'react';
import * as d3 from 'd3';
import Overview from 'components/Overview';
import CircularView from 'components/CircularView';
import InspectionView from 'components/InspectionView';
import ControlView from 'components/ControlView';
import {scaleRadial} from '../../lib/draw_radial.js'

import styles from './styles.scss';
import factors_data from '../../data/sports_factors_3_20.json';
import gs from '../../config/_variables.scss'; // gs (=global style)

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			screeData: factors_data.scree,
			factors_data: factors_data.data,
			descriptors: factors_data.descriptors,
			descriptors_mean: factors_data.average,
			descriptors_text: [],
			components_cnt:factors_data.data.length,
			modes:factors_data.modes,
			bar_data: {},
			max_pattern_item:{},
			mouseOveredPatternIdx: '',
			mouseOveredPatternData: {},
			selectedPatterns: [],
			currentSelectedPatternIdx:'',
			mostSimilarPatternToSelectedPatternIdx:[],
			leastSimilarPatternToSelectedPatternIdx:[],
			arc_positions_bar_petal:[]
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

	handleClickPattern(idx, petals_path_items, innerRadius, outerRadius) { 
		const newSelectedPattern = idx;
		console.log('clicked id: ', idx);
		// update the petal width to match the similarity of the selected patterns.		
		const factors = factors_data.data;

		var mostSimilarPattern = [],
			tensor_dims = factors_data.modes.length,
			bar_data_cur = this.state.bar_data,
			selectedPatternCnt = this.state.selectedPatterns.length + 1,		
			y = scaleRadial()
				.range([innerRadius, outerRadius])   // Domain will be define later.
				.domain([0, 1]); // Domain of Y is from 0 to the max seen in the data
	

		factors.forEach(function(d, id) {
			d.petals = d3.range(d.dims).map(function(i) { 
				// larger entropy, less concentrated descritors
				// close to 0, more concentrated descriptors
				return {id: id, length: 1 - d.factors[i].entropy,
						width: d.factors[i].similarity[idx]}; 
			});
			d.circles = {dominance: d.weight, radius: 6};     
		});

		// add the most and least similar pattern idx;
		var max_ids = [],
			min_ids = [];
		for(var i = 0; i < factors_data.data[0].dims; i++){
			max_ids.push(factors[idx].factors[i].similarity.max_idx);
			min_ids.push(factors[idx].factors[i].similarity.min_idx);
		}

		var arc_positions_bar_petal = d3.range(tensor_dims).map(function(i){
			console.log(petals_path_items[i].translate_flower);
			var items = Object.keys(bar_data_cur[i][0]).filter((d) => d !== "id").sort(),
				x = d3.scaleBand()
					.range([2*Math.PI*(i+1)/tensor_dims-0.4,  2*Math.PI*(i+2)/tensor_dims-0.9])    
					.domain(items) // The domain of the X axis is the list of states.
					.paddingInner(0.05),
				arcStart = d3.arc()
					.innerRadius(innerRadius)
					.outerRadius((d) => y(bar_data_cur[i][idx][petals_path_items[i].item]))
					.startAngle((d) => x(petals_path_items[i].item) + x.bandwidth()*(i+0.5)/selectedPatternCnt)
					.endAngle((d) => x(petals_path_items[i].item) + x.bandwidth()*(i+0.5)/selectedPatternCnt)
					.padAngle(0.01)
					.padRadius(innerRadius).centroid(),
				translate_flower = petals_path_items[i].translate_flower.replace("translate(","").replace(")","").split(","),
				// tip of the petal				
				arcEnd_flower = petals_path_items[i].d_flower.split('M').join(',').split('Q').join(',').split(' ').join(',').split(',').slice(5,7),
				// root of the bar -- to be completed -- for now, using the arcStart
				arcEnd_bar = petals_path_items[i].d_bar.split('M').join(',').split('Q').join(',').split(' ').join(',').split(',');
			if(i==2){
				console.log(petals_path_items[i].d_flower.split('M').join(',').split('Q').join(',').split(' ').join(',').split(','));
			}
			
			// console.log(petals_path_items[i].d_bar);
			return [{"x": parseFloat(translate_flower[0]) - parseFloat(arcEnd_flower[0]), 
						"y": parseFloat(translate_flower[1]) - parseFloat(arcEnd_flower[1])}, 
					{"x": arcStart[0], "y": arcStart[1]}]

		})
		console.log(arc_positions_bar_petal);

		



	// Test chunk for adding links between the petals and the bars  
	// var arcEnd = flowers.select('path#petal_13_0.petal');
	// arcEnd = arcEnd.split('M').join(',').split('Q').join(',').split(' ').join(',').split(',').slice(5,7);


		this.setState(prevState => ({
			selectedPatterns: [...prevState.selectedPatterns, newSelectedPattern],
			currentSelectedPatternIdx: newSelectedPattern
		}));

		this.setState({
			factors_data: factors_data.data,
			arc_positions_bar_petal: arc_positions_bar_petal,
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
		var max_pattern_item = {};
		factors.forEach(function(d, id) {
			d.petals = d3.range(d.dims).map(function(i) { 
			// larger entropy, less concentrated descritors
			// close to 0, more concentrated descriptors
				return {id: id, length: 1 - d.factors[i].entropy,
					width: d.factors[i].similarity.average}; 
			});
			d.circles = {dominance: d.weight, radius: 6};     
		});

		for(var i = 0; i < factors_data.data[0].dims; i++){
			bar_data[i] = [];
			max_pattern_item[i] = [];
			var pattern_cnt = factors_data.data.length;
			for(var j = 0; j < pattern_cnt; j++) {
				bar_data[i].push(factors_data.data[j].factors[i].values); 
				max_pattern_item[i].push(factors_data.data[j].factors[i].max_item);         
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
			screeData: factors_data.scree,
			descriptors: factors_data.descriptors,      
			factors_data: factors_data.data,
			descriptors_text: descriptors_text,
			bar_data: bar_data,      
			max_pattern_item: max_pattern_item,
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
			descriptors, descriptors_text,screeData,max_pattern_item, arc_positions_bar_petal} = this.state;

	return (
	  <div className="App">
		<header className="header">
		  <h1 className="title">Tensor Pattern Exploration</h1>
		</header>
		<div className={styles.wrapper}>
		  <div className={styles.infoPanel}>
			<div>#Patterns: {this.state.factors_data.length}</div>
			<div>#Descriptors: {descriptors_text.join(", ")}</div>
			<ControlView
			  screeData={screeData}
			/>
		  </div>
		  <CircularView 
			className={styles.Overview}
			data={factors_data}
			onClickPattern={this.handleClickPattern}
			onUnClickPattern={this.handleUnClickPattern}
			onMouseOverPattern={this.handleMouseOverPattern}
			onMouseOutPattern={this.handleMouseOutPattern}                        
			leastSimilarPatternToSelectedPatternIdx={leastSimilarPatternToSelectedPatternIdx}              
			mostSimilarPatternToSelectedPatternIdx={mostSimilarPatternToSelectedPatternIdx}          
			bar_data={bar_data}     
			max_pattern_item={max_pattern_item}             
			selectedPatterns={selectedPatterns}
			components_cnt={components_cnt}
			arc_positions_bar_petal={arc_positions_bar_petal}
			modes={modes}
		  />          
		  <div>
			<InspectionView 
			  className={styles.InspectionView}
			  mouseOveredPattern={this.state.mouseOveredPatternData} 
			  data = {factors_data}              
			  mouseOveredPatternIdx={this.state.mouseOverPattern}
			/>
		  </div>


		</div>
		
	  </div>
	);
  }
}

export default App;
