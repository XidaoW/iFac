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

	// depricated
	handleMouseOverPattern(idx){
		const { factors_data } = this.state,
			newMouseOverPatternIdx = idx;

		this.setState(prevState => ({
		  mouseOveredPatternIdx: newMouseOverPatternIdx,
		  mouseOveredPatternData: factors_data[idx]
		}));
	}
	// depricated
	handleMouseOutPattern(id){
		this.setState(prevState => ({
			mouseOveredPatternIdx: ''
		}));
	}


	handleClickPattern(idx, petals_path_items) { 
		/**
		 * Handles the click events over the patterns.
		 *
		 * Prepares data When users select one or two patterns. 
		 * 1) When user click on one pattern: 
		 * 	a) updates the petal to match with the simialrity of the selected patterns.
		 * 	b) computes the patterns with max and min similarity on each descriptor.
		 * 	c) computes the line path start and end coordinates of the pattern flower and the bar items. 
		 * 2) When user click and select two patterns:
		 * 	a) it updates the bar data to include the difference between the two patterns.
		 * 3) Update the state.		 
		 *
		 * @since      0.0.0
		 *
		 * @fires   click
		 * @fires   gFlowers.selectAll('.circle')#click
		 *
		 * @param {var}   idx           the id of clicked pattern.
		 * @param {object} petals_path_items     a object of key-value pair that contains the transform and translates of related items and patterns.
		 * 
		 */
		const newSelectedPattern = idx,
			factors = factors_data.data,
			tensor_dims = factors_data.modes.length,			
			prev_selected_patterns = this.state.selectedPatterns,
			selectedPatternCnt = prev_selected_patterns.length + 1;

		let mostSimilarPattern = [],
			max_ids = [],
			min_ids = [],			
			bar_data_cur = this.state.bar_data;
			
	
		factors.forEach(function(d, id) {
			d.petals = d3.range(d.dims).map(function(i) { 
				return {
						id: id, length: 1 - d.factors[i].entropy,
						width: d.factors[i].similarity[idx]
				}; 
			});
		});

		for(var i = 0; i < factors_data.data[0].dims; i++){
			max_ids.push(factors[idx].factors[i].similarity.max_idx);
			min_ids.push(factors[idx].factors[i].similarity.min_idx);
		}

		const arc_positions_bar_petal = d3.range(tensor_dims).map(function(i) {
			// get the flower coordinates and rotation degree
			const translate_flower = petals_path_items[i].translate_flower.replace('translate(','').replace(')','').split(','),
					translate_g_flower = petals_path_items[i].transform_g_flower.replace('translate(','').replace(')','').split(','),
					translate_bar = petals_path_items[i].transform_bar.replace('translate(','').replace(')','').split(','),
					translate_petal = petals_path_items[i].transform_petal.replace('rotate(','').replace(')','').split(',');
			// tip of the petal (not true; currently using the center of the flower)	
			const	arcEnd_bar = petals_path_items[i].d_bar.split('M').join(',').split('A').join(',').split('L').join(',').split(' ').join(',').split(','),
					arcEnd_bar_start = arcEnd_bar.slice(10,12),
					arcEnd_bar_end = arcEnd_bar.slice(17,19);

			return {
				degree: parseFloat(translate_petal),
				coordinates:[
					{
						x: parseFloat(translate_flower[0]), 
						y: parseFloat(translate_flower[1])
					}, 
					{
						x: parseFloat(translate_bar[0])+((parseFloat(arcEnd_bar_start[0]) + parseFloat(arcEnd_bar_end[0]))/2)-parseFloat(translate_g_flower[0]),
						y: parseFloat(translate_bar[1])+((parseFloat(arcEnd_bar_start[1]) + parseFloat(arcEnd_bar_end[1]))/2)-parseFloat(translate_g_flower[1])
					}
				]
			};
		})

		if(selectedPatternCnt == 2){
			Object.keys(bar_data_cur).map(function(key, index){
				bar_data_cur[key][factors.length+1] = Object.keys(bar_data_cur[key][0]).reduce(function(obj, keyItem){
					obj[keyItem] = (bar_data_cur[key][newSelectedPattern][keyItem] - bar_data_cur[key][prev_selected_patterns][keyItem]);
					return obj;
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

	handleUnClickPattern(idx) {
		/**
		 * Handles the click again events over the patterns.
		 *
		 * Prepares data When users unclick pattern. 
		 * 1) When user click on one pattern: 
		 * 	a) updates the petal to match with the average simialrity of all patterns.
		 * 3) Update the state.		 
		 *
		 * @since      0.0.0
		 *
		 * @fires   click
		 * @fires   gFlowers.selectAll('.circle')#click
		 *
		 * @param {var}   idx           the id of clicked pattern.
		 * 
		 */
		const newSelectedPattern = idx,
			factors = factors_data.data;

		factors.forEach(function(d, id) {
			d.petals = d3.range(d.dims).map(function(i) { 
				return {
					id: id, length: 1 - d.factors[i].entropy,
					width: d.factors[i].similarity.average
				}; 
			});   
		});

		this.setState(prevState => ({
			selectedPatterns: prevState.selectedPatterns.filter((d) => d !== newSelectedPattern),
			currentSelectedPatternIdx: '',
			factors_data: factors_data.data
		}));
	}



	handleClickItem(new_queries, top_k) { 
		/**
		 * Handles the click items events.
		 *
		 * Prepares data when users click on items. 
		 * 1) When user click on item: 
		 * 	a) calculate the similarity between the pattern and the query.
		 * 	b) sort the patterns based on the similarity and select the top_k patterns.
		 * 	c) reformat that similarities to include the coordinates
		 * 2) Update the state.		 
		 *
		 * @since      0.0.0
		 *
		 * @param {object}   new_queries           the dictionary of queries, 
		 * e.g., new_queries = {0: ["MA", "VA", "PA"], 1: ["Housing", "Health"], 2: ["2012","2013"]}.
		 * @param {var}   top_k         the number of top patterns.
		 * 
		 */
		const pattern_cnt = factors_data.data.length;
		// p(item1_descriptor1/pattern)*p(item2_descriptor1/pattern)*p(item3_descriptor2/pattern)*p(item4_descriptor3/pattern)
		let similarPatternToQueries = this.calculateSimilarityBtnPatternToQueries(pattern_cnt, new_queries),
			pattern_idx,
			relevance_score,
			coordinates;


		similarPatternToQueries.sort(function(first, second) {
			return second[1] - first[1];
		}).slice(0, top_k);
		similarPatternToQueries = d3.range(top_k).map(function(i){
			pattern_idx = similarPatternToQueries[i][0];
			relevance_score = similarPatternToQueries[i][1];
			coordinates = factors_data.data[pattern_idx].tsne_coord;
			return {
					"rank": i,
					"pattern_idx": pattern_idx,
					"relevance_score":relevance_score,
					"tsne_coord":coordinates
				};
		});

		this.setState({
			queries:new_queries,
			similarPatternToQueries: similarPatternToQueries
		});
	}

	calculateSimilarityBtnPatternToQueries(pattern_cnt, new_queries) {
		/**
		 * Caculates the similarity between patterns and the query.
		 *
		 * The relevance is defined as:
		 * \prod_{d\in D^{'}}\prod_{i\in I^{'}} ~p_{di},
		 * where D^{'} is the set of descriptors and I^{'} is the set of items in new_queries
		 * and p_{di} is the probability of item i in descriptor d for each pattern.
		 * 1) When user click on item: 
		 * 	a) calculate the similarity between the pattern and the query.
		 * 	b) sort the patterns based on the similarity and select the top_k patterns.
		 * 	c) reformat that similarities to include the coordinates
		 * 2) Update the state.		 
		 *
		 * @since      0.0.0
		 *
		 * @param {var}   pattern_cnt           the total number of patterns.
		 * @param {object}   new_queries         the query.
		 * e.g., new_queries = {0: ["MA", "VA", "PA"], 1: ["Housing", "Health"], 2: ["2012","2013"]}.		 
		 * @return {tuple} [[0, 0.02],[1, 0.01], ...] the relevance score for each pattern.
		 * 
		 */		
		return d3.range(pattern_cnt).map(function(i){
			let query_result = 	Object.keys(new_queries).map(function(key, index){
					let query_result_each_key = new_queries[key].map(function(queryKey){					
						// obtain p_{di} from factors_data
						return factors_data.data[i].factors[key].values[queryKey];
					});				
					// multiply each probability if there are more than one item, otherwise use the probability of that item.
					// p_d = \prod_{i\in I^{'}} ~p_{di}
					return (query_result_each_key.length > 1)? query_result_each_key.reduce((a,b) => a * b) : query_result_each_key
				});
			query_result = query_result.map(function(key){
				// if there are no items in the query from certain descriptor, use 1 to multiply the ones that have items.				
				return key.length == 0? 1:key; 
			});
			// multiply the prob from each descriptor.
			// p = \prod_{d\in D^{'}}~p_d
			query_result = query_result.reduce((a,b) => a * b)
			return [
				i, query_result
			];
		});
	}
	handleMouseOverItem(descriptor_index, key, idx){
		/**
		 * Handles the mouseover items events.
		 *
		 * @depricated      0.0.0
		 * 
		 */		
		const { factors_data } = this.state,
			newMouseOverPatternIdx = idx;

		console.log('mouseovered id: ', factors_data);
		console.log('mouseovered id: ', idx);

		this.setState(prevState => ({
		  mouseOveredPatternIdx: newMouseOverPatternIdx,
		  mouseOveredPatternData: factors_data[idx]
		}));

	}
	handleMouseOutItem(descriptor_index, key){
		/**
		 * Handles the mouseout items events.
		 *
		 * @depricated      0.0.0
		 * 
		 */			
		this.setState(prevState => ({
			mouseOveredPatternIdx: ''
		}));
	}

	componentWillMount() {
		/**
		 * Being called before rendering (preparing data to pass it to children)
		 *
		 * Prepares the data upon mounting
		 * 1) update factors to include petal and circle data (potentially can be moved to python data generation process).
		 * 2) generate the bar_data and push the average distribution to the last element of the bar_data.
		 * 3) generate the descriptor descriptors.
		 * 4) update the state
		 * @since      0.0.0
		 *
		 * 
		*/		
		const _self = this,
			factors = factors_data.data,
			queries = d3.range(factors[0].dims).reduce((obj, item) => {
				obj[item] = [];
				return obj;
			}, {});
		let bar_data = {},
			max_pattern_item = {},
			descriptors_text = [];


		factors.forEach(function(d, id) {
			d.petals = d3.range(d.dims).map(function(i) { 
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

		for (let key in factors_data.descriptors) {
			if (factors_data.descriptors.hasOwnProperty(key)) {
				descriptors_text.push(key + '(' + factors_data.descriptors[key].length + ')');
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
