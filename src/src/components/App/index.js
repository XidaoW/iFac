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
			item_max_pattern: factors_data.item_max_pattern,
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
	this.handleClickItem = this.handleClickItem.bind(this);
	this.handleUnClickItem = this.handleUnClickItem.bind(this);
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

	handleClickPattern(idx, petals_path_items) { 
		const newSelectedPattern = idx;
		console.log('clicked id: ', idx);
		// update the petal width to match the similarity of the selected patterns.		
		const factors = factors_data.data;

		var mostSimilarPattern = [],
			tensor_dims = factors_data.modes.length,
			bar_data_cur = this.state.bar_data,
			selectedPatternCnt = this.state.selectedPatterns.length + 1;
	

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
			var translate_flower = petals_path_items[i].translate_flower.replace("translate(","").replace(")","").split(","),
				translate_g_flower = petals_path_items[i].transform_g_flower.replace("translate(","").replace(")","").split(","),
				translate_bar = petals_path_items[i].transform_bar.replace("translate(","").replace(")","").split(","),
				translate_petal = petals_path_items[i].transform_petal.replace("rotate(","").replace(")","").split(","),
				// tip of the petal				
				arcEnd_flower = petals_path_items[i].d_flower.split('M').join(',').split('Q').join(',').split(' ').join(',').split(',').slice(5,7),
				arcEnd_bar = petals_path_items[i].d_bar.split('M').join(',').split('A').join(',').split('L').join(',').split(' ').join(',').split(','),
				arcEnd_bar_start = arcEnd_bar.slice(10,12),
				arcEnd_bar_end = arcEnd_bar.slice(17,19);

			return {"degree": parseFloat(translate_petal),
					"coordinates":[{
									"x": parseFloat(translate_flower[0]) - 0, 
									"y":parseFloat(translate_flower[1]) - 0
									}, 
								{
									"x": parseFloat(translate_bar[0])+((parseFloat(arcEnd_bar_start[0]) + parseFloat(arcEnd_bar_end[0]))/2)-parseFloat(translate_g_flower[0]),
					 				"y": parseFloat(translate_bar[1])+((parseFloat(arcEnd_bar_start[1]) + parseFloat(arcEnd_bar_end[1]))/2)-parseFloat(translate_g_flower[1])
								}
					]}

		})

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


	handleClickItem(idx, petals_path_items) { 
		const newSelectedPattern = idx;
		console.log('clicked id: ', idx);
		// update the petal width to match the similarity of the selected patterns.		

		var mostSimilarPattern = [],
			tensor_dims = factors_data.modes.length,
			bar_data_cur = this.state.bar_data,
			selectedPatternCnt = this.state.selectedPatterns.length + 1;
	
		var arc_positions_bar_petal = d3.range(tensor_dims).map(function(i){
			var translate_flower = petals_path_items[i].translate_flower.replace("translate(","").replace(")","").split(","),
				translate_g_flower = petals_path_items[i].transform_g_flower.replace("translate(","").replace(")","").split(","),
				translate_bar = petals_path_items[i].transform_bar.replace("translate(","").replace(")","").split(","),
				translate_petal = petals_path_items[i].transform_petal.replace("rotate(","").replace(")","").split(","),
				// tip of the petal				
				arcEnd_flower = petals_path_items[i].d_flower.split('M').join(',').split('Q').join(',').split(' ').join(',').split(',').slice(5,7),
				arcEnd_bar = petals_path_items[i].d_bar.split('M').join(',').split('A').join(',').split('L').join(',').split(' ').join(',').split(','),
				arcEnd_bar_start = arcEnd_bar.slice(10,12),
				arcEnd_bar_end = arcEnd_bar.slice(17,19);

			return {"degree": parseFloat(translate_petal),
					"coordinates":[{
									"x": parseFloat(translate_flower[0]) - 0, 
									"y":parseFloat(translate_flower[1]) - 0
									}, 
								{
									"x": parseFloat(translate_bar[0])+((parseFloat(arcEnd_bar_start[0]) + parseFloat(arcEnd_bar_end[0]))/2)-parseFloat(translate_g_flower[0]),
					 				"y": parseFloat(translate_bar[1])+((parseFloat(arcEnd_bar_start[1]) + parseFloat(arcEnd_bar_end[1]))/2)-parseFloat(translate_g_flower[1])
								}
					]}

		})


		this.setState({
			arc_positions_bar_petal: arc_positions_bar_petal,
		});
	}

	handleUnClickItem(id) {
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
			item_max_pattern: factors_data.item_max_pattern,
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
			descriptors, descriptors_text,screeData,max_pattern_item, arc_positions_bar_petal, 
			item_max_pattern} = this.state;
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
			item_max_pattern={item_max_pattern}
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
