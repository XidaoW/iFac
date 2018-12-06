import React, { Component } from 'react';
import * as d3 from 'd3';
import Overview from 'components/Overview';
import CircularView from 'components/CircularView';
import InspectionView from 'components/InspectionView';
import ControlView from 'components/ControlView';
import { scaleRadial } from '../../lib/draw_radial.js'

import styles from './styles.scss';
// import factors_data from '../../data/sports_factors_3_20.json';
import factors_data from '../../data/policy_factors_3_20.json';
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
			item_similarity: factors_data.itemSimilarity,
			descriptors_text: [],
			modes: factors_data.modes,
			bar_data: {},
			max_pattern_item: {},
			mouseOveredPatternIdx: '',
			mouseOveredPatternData: {},
			selectedPatterns: [],
			currentSelectedPatternIdx:'',
			mostSimilarPatternToSelectedPatternIdx:[],
			leastSimilarPatternToSelectedPatternIdx:[],
			arc_positions_bar_petal:[],
			queries:{},
			similarPatternToQueries:[]

		};

		this.handleClickPattern = this.handleClickPattern.bind(this);
		this.handleUnClickPattern = this.handleUnClickPattern.bind(this);
		this.handleClickItem = this.handleClickItem.bind(this);
		this.handleMouseOverPattern = this.handleMouseOverPattern.bind(this);
		this.handleMouseOutPattern = this.handleMouseOutPattern.bind(this);
		this.handleMouseOverItem = this.handleMouseOverItem.bind(this);
		this.handleMouseOutItem = this.handleMouseOutItem.bind(this);

	}

	handleMouseOverPattern(idx){
		const { factors_data } = this.state;
		const newMouseOverPatternIdx = idx;

		console.log('mouseovered id: ', factors_data);
		console.log('mouseovered id: ', idx);

		this.setState(prevState => ({
		  mouseOveredPatternIdx: newMouseOverPatternIdx,
		  mouseOveredPatternData: factors_data[idx]
		}));

	}
	handleMouseOutPattern(id){
		this.setState(prevState => ({
			mouseOveredPatternIdx: ''
		}));
	}

	handleClickPattern(idx, petals_path_items) { 

		const newSelectedPattern = idx;
		console.log('clicked id: ', idx);
		// update the petal width to match the similarity of the selected patterns.		
		const factors = factors_data.data;
		let mostSimilarPattern = [],
				tensor_dims = factors_data.modes.length,
				bar_data_cur = this.state.bar_data,
				prev_selected_patterns = this.state.selectedPatterns,
				selectedPatternCnt = prev_selected_patterns.length + 1;
	
		factors.forEach(function(d, id) {
			d.petals = d3.range(d.dims).map(function(i) { 
				// larger entropy, less concentrated descritors
				// close to 0, more concentrated descriptors
				return {
						id: id, length: 1 - d.factors[i].entropy,
						width: d.factors[i].similarity[idx]
				}; 
			});

			d.circles = {
				dominance: d.weight, 
				radius: 6
			};     
		});

		// add the most and least similar pattern idx;
		let max_ids = [],
				min_ids = [];
		for(var i = 0; i < factors_data.data[0].dims; i++){
			max_ids.push(factors[idx].factors[i].similarity.max_idx);
			min_ids.push(factors[idx].factors[i].similarity.min_idx);
		}

		const arc_positions_bar_petal = d3.range(tensor_dims).map(function(i) {
			const translate_flower = petals_path_items[i].translate_flower.replace('translate(','').replace(')','').split(','),
						translate_g_flower = petals_path_items[i].transform_g_flower.replace('translate(','').replace(')','').split(','),
						translate_bar = petals_path_items[i].transform_bar.replace('translate(','').replace(')','').split(','),
						translate_petal = petals_path_items[i].transform_petal.replace('rotate(','').replace(')','').split(',');
			// tip of the petal				
			const	arcEnd_flower = petals_path_items[i].d_flower.split('M').join(',').split('Q').join(',').split(' ').join(',').split(',').slice(5,7),
						arcEnd_bar = petals_path_items[i].d_bar.split('M').join(',').split('A').join(',').split('L').join(',').split(' ').join(',').split(','),
						arcEnd_bar_start = arcEnd_bar.slice(10,12),
						arcEnd_bar_end = arcEnd_bar.slice(17,19);

			return {
				degree: parseFloat(translate_petal),
				coordinates:[
					{
						x: parseFloat(translate_flower[0]) - 0, 
						y:parseFloat(translate_flower[1]) - 0
					}, 
					{
						x: parseFloat(translate_bar[0])+((parseFloat(arcEnd_bar_start[0]) + parseFloat(arcEnd_bar_end[0]))/2)-parseFloat(translate_g_flower[0]),
						y: parseFloat(translate_bar[1])+((parseFloat(arcEnd_bar_start[1]) + parseFloat(arcEnd_bar_end[1]))/2)-parseFloat(translate_g_flower[1])
					}
				]
			};
		})
		// if selected two patterns, we generate the comparison data (difference between two patterns) and assign it to the bar dtaa.
		if(selectedPatternCnt == 2){
			Object.keys(bar_data_cur).map(function(key, index){
				bar_data_cur[key][factors.length+1] = Object.keys(bar_data_cur[key][0]).reduce(function(obj, keyItem){
					obj[keyItem] = (bar_data_cur[key][newSelectedPattern][keyItem] - bar_data_cur[key][prev_selected_patterns][keyItem])
					return obj 
				}, {});
			});
		}

		this.setState(prevState => ({
			selectedPatterns: [...prevState.selectedPatterns, newSelectedPattern],
			currentSelectedPatternIdx: newSelectedPattern,
			factors_data: factors_data.data,
			bar_data: bar_data_cur,
			arc_positions_bar_petal: arc_positions_bar_petal,
			mostSimilarPatternToSelectedPatternIdx: max_ids,
			leastSimilarPatternToSelectedPatternIdx: min_ids
		}));
	}

	handleUnClickPattern(id) {
		const newSelectedPattern = id;
		const factors = factors_data.data;

		factors.forEach(function(d, id) {
			d.petals = d3.range(d.dims).map(function(i) { 
			// larger entropy, less concentrated descritors
			// close to 0, more concentrated descriptors
				return {
					id: id, length: 1 - d.factors[i].entropy,
					width: d.factors[i].similarity.average
				}; 
			});

			d.circles = {
				dominance: d.weight, 
				radius: 6
			};     
		});

		this.setState(prevState => ({
			selectedPatterns: prevState.selectedPatterns.filter((d) => d !== newSelectedPattern),
			currentSelectedPatternIdx: '',
			factors_data: factors_data.data
		}));
	}



	handleClickItem(new_queries, top_k) { 
		// Query single item from sinle descriptor
		const pattern_cnt = factors_data.data.length;


		// 	new_queries = {0: ["MA", "VA", "PA"], 1: ["Housing", "Health"], 2: ["2012","2013"]};
		// p(item1_descriptor1/pattern)*p(item2_descriptor1/pattern)*p(item3_descriptor2/pattern)*p(item4_descriptor3/pattern)
		// WANT TO ISOLATE THIS CHUNK OF CODE
		let similarPatternToQueries = this.calculateSimilarityBtnPatternToQueries(pattern_cnt, new_queries);

		similarPatternToQueries.sort(function(first, second) {
			return second[1] - first[1];
		});
		similarPatternToQueries = similarPatternToQueries.slice(0, top_k);
		similarPatternToQueries = d3.range(top_k).map(function(i){
			let pattern_idx = similarPatternToQueries[i][0],
				relevance_score = similarPatternToQueries[i][1],
				coordinates = factors_data.data[pattern_idx].tsne_coord;
			return {"rank": i,
					"pattern_idx": pattern_idx,
					"relevance_score":relevance_score,
					"tsne_coord":coordinates};
		});

		this.setState({
			queries:new_queries,
			similarPatternToQueries: similarPatternToQueries
		});
	}

	// formatSimilarPatterns(similarPatternToQueries, factors_data){

	// }
	calculateSimilarityBtnPatternToQueries(pattern_cnt, new_queries) {
		return d3.range(pattern_cnt).map(function(i){
			let query_result = 	Object.keys(new_queries).map(function(key, index){
					let query_result_each_key = new_queries[key].map(function(queryKey){					
						return factors_data.data[i].factors[key].values[queryKey];
					})
					
					if(query_result_each_key.length > 1){
						query_result_each_key = query_result_each_key.reduce((a,b) => a * b)
					}
					return query_result_each_key;
				})
			query_result = query_result.map(function(key){
				if(key.length == 0){
					return 1;
				}else{
					return key;
				}
			})
			query_result = query_result.reduce((a,b) => a * b)
			return [
				i, query_result
			];
		});
	}
	handleMouseOverItem(descriptor_index, key, idx){
		const { factors_data } = this.state;
		const newMouseOverPatternIdx = idx;

		console.log('mouseovered id: ', factors_data);
		console.log('mouseovered id: ', idx);

		this.setState(prevState => ({
		  mouseOveredPatternIdx: newMouseOverPatternIdx,
		  mouseOveredPatternData: factors_data[idx]
		}));

	}
	handleMouseOutItem(descriptor_index, key){
		this.setState(prevState => ({
			mouseOveredPatternIdx: ''
		}));
	}

	// Being called before rendering (preparing data to pass it to children)
	componentWillMount() {
		const _self = this;
		const factors = factors_data.data;
		let bar_data = {};
		let max_pattern_item = {};

		factors.forEach(function(d, id) {
			d.petals = d3.range(d.dims).map(function(i) { 
			// larger entropy, less concentrated descritors
			// close to 0, more concentrated descriptors
				return {
					id: id, length: 1 - d.factors[i].entropy,
					width: d.factors[i].similarity.average
				}; 
			});
			d.circles = {
				dominance: d.weight, 
				radius: 6
			};     
		});

		for(let i = 0; i < factors_data.data[0].dims; i++){
			bar_data[i] = [];
			max_pattern_item[i] = [];
			let pattern_cnt = factors_data.data.length;
			for(let j = 0; j < pattern_cnt; j++) {
				bar_data[i].push(factors_data.data[j].factors[i].values); 
				max_pattern_item[i].push(factors_data.data[j].factors[i].max_item);         
			}      
			bar_data[i].push(factors_data.average[i]); 
		}

		let descriptors_text = [];
		for (let key in factors_data.descriptors) {
			if (factors_data.descriptors.hasOwnProperty(key)) {
				descriptors_text.push(key + '(' + factors_data.descriptors[key].length + ')');
			}
		}

		const queries = d3.range(factors[0].dims).reduce((obj, item) => {
		     obj[item] = []
		     return obj
		   }, {})

		this.setState({
			screeData: factors_data.scree,
			item_max_pattern: factors_data.item_max_pattern,
			descriptors: factors_data.descriptors,      
			factors_data: factors_data.data,
			descriptors_text: descriptors_text,
			bar_data: bar_data,      
			max_pattern_item: max_pattern_item,
			descriptors_mean: factors_data.average,
			modes: factors_data.modes,
			queries: queries
		});    
	}

  render() {
	if (!this.state.bar_data || this.state.bar_data.length === 0)
	  return <div />

	const { factors_data, bar_data, descriptors_mean,
			selectedPatterns, mouseOveredPattern, modes,			
			mostSimilarPatternToSelectedPatternIdx,leastSimilarPatternToSelectedPatternIdx,
			descriptors, descriptors_text,screeData, max_pattern_item, arc_positions_bar_petal, 
			item_max_pattern,queries,similarPatternToQueries, item_similarity } = this.state;

	const components_cnt = factors_data.length;

	return (
	  <div className='App'>
		<header className='header'>
		  <h1 className='title'>Tensor Pattern Exploration</h1>
		</header>
		<div className={styles.wrapper}>
		  <div className={styles.infoPanel}>
				<div>#Patterns: {components_cnt}</div>
				<div>#Descriptors: {descriptors_text.join(', ')}</div>
				<ControlView
					screeData={screeData}
				/>
		  </div>
		  <CircularView 
				className={styles.Overview}
				data={factors_data}
				onClickPattern={this.handleClickPattern}
				onUnClickPattern={this.handleUnClickPattern}
				onClickItem={this.handleClickItem}
				onMouseOverPattern={this.handleMouseOverPattern}
				onMouseOutPattern={this.handleMouseOutPattern}                        
				onMouseOverItem={this.handleMouseOverItem}
				onMouseOutItem={this.handleMouseOutItem}                        
				leastSimilarPatternToSelectedPatternIdx={leastSimilarPatternToSelectedPatternIdx}              
				mostSimilarPatternToSelectedPatternIdx={mostSimilarPatternToSelectedPatternIdx}          
				bar_data={bar_data}     
				max_pattern_item={max_pattern_item}             
				selectedPatterns={selectedPatterns}
				components_cnt={components_cnt}
				arc_positions_bar_petal={arc_positions_bar_petal}
				item_max_pattern={item_max_pattern}
				item_similarity={item_similarity}
				modes={modes}
				queries={queries}
				similarPatternToQueries={similarPatternToQueries}
		  />          
		  <div>
				<InspectionView 
					className={styles.InspectionView}
					mouseOveredPattern={this.state.mouseOveredPatternData} 
					data={factors_data}              
					mouseOveredPatternIdx={this.state.mouseOveredPatternIdx}
				/>
		  </div>


		</div>
		
	  </div>
	);
  }
}

export default App;
