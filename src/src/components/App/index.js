import React, { Component } from 'react';
import * as d3 from 'd3';
import Overview from 'components/Overview';
import CircularView from 'components/CircularView';
import DetailView from 'components/DetailView';
// import InspectionView from 'components/InspectionView';
import ControlView from 'components/ControlView';
import { extractItemCoordinates, extractPetalBarCoordinates } from '../../lib/extract_coordinates.js'
import { computeMeanStd } from '../../lib/draw_linechart.js'

import styles from './styles.scss';
import index from '../../index.css';

import metrics from '../../data/nbaplayer/factors_3_19_sample_fit_metrics.json';
import factors_data from '../../data/nbaplayer/factors_3_19_sample_fit.json';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			screeData: factors_data.scree,
			factors_data: factors_data.data,
			descriptors: factors_data.descriptors,
			screeData: metrics,
			descriptors_mean: factors_data.average,
			item_max_pattern: factors_data.item_max_pattern,
			item_similarity: factors_data.itemSimilarity,
			descriptors_text: [],
			modes: factors_data.modes,
			bar_data: {},
			max_pattern_item: {},
			mouseOveredPatternIdx: '',
			mouseOveredPatternData: {},
			mouseOveredDescriptorIdx: '',						
			selectedPatterns: [],
			currentSelectedPatternIdx:'',
			mostSimilarPatternToSelectedPatternIdx:[],
			leastSimilarPatternToSelectedPatternIdx:[],
			arc_positions_bar_petal:[],
			queries:{},
			similarPatternToQueries:[],
			item_links: [],
			error_data: [],
			stability_data: [],
			interpretability_data: [],
			datasets: ['nbaplayer', 'policy', 'picso'],
			domain: "nbaplayer"
		};

		this.handleClickPattern = this.handleClickPattern.bind(this);
		this.handleUnClickPattern = this.handleUnClickPattern.bind(this);
		this.handleClickItem = this.handleClickItem.bind(this);
		this.handleMouseOverPattern = this.handleMouseOverPattern.bind(this);
		this.handleMouseOutPattern = this.handleMouseOutPattern.bind(this);
		this.handleMouseOverItem = this.handleMouseOverItem.bind(this);
		this.handleMouseOutItem = this.handleMouseOutItem.bind(this);
		this.handleClickPoint = this.handleClickPoint.bind(this);
		this.handleChangeDataset = this.handleChangeDataset.bind(this);
	}

	componentWillUpdate(nextProps, nextState) {
		if (this.state.domain !== nextState.domain)  {
			console.log('domain changed: ', nextState.domain);
		}
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
					factors = this.state.factors_data,
					screeData = metrics,
					start_index = 2,
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
					"id": id, "length": 1 - d.factors[i].entropy,
					"width": d.factors[i].similarity.average
				}; 
			});
			d.circles = {
				"dominance": d.weight, 
				"radius": 6
			};     
		});

		for(let i = 0; i < factors[0].dims; i++){
			bar_data[i] = [];
			max_pattern_item[i] = [];
			let pattern_cnt = factors.length;
			for(let j = 0; j < pattern_cnt; j++) {
				bar_data[i].push(factors[j].factors[i].values); 
				max_pattern_item[i].push(factors[j].factors[i].max_item);         
			}      
			bar_data[i].push(this.state.descriptors_mean[i]); 
		}

		for (let key in this.state.descriptors) {
			if (this.state.descriptors.hasOwnProperty(key)) {
				descriptors_text.push(key + '(' + this.state.descriptors[key].length + ')');
			}
		}


		// compute scree data
		screeData['error'] = screeData['error'].filter(Boolean);
		screeData['stability'] = screeData['stability'].filter(Boolean);
		screeData['fit'] = screeData['fit'].filter(Boolean);
		screeData['entropy'] = screeData['entropy'].filter(Boolean);
		screeData['normalized_entropy'] = screeData['normalized_entropy'].filter(Boolean);
		screeData['gini'] = screeData['gini'].filter(Boolean);
		screeData['theil'] = screeData['theil'].filter(Boolean);
		screeData['pctnonzeros'] = screeData['pctnonzeros'].filter(Boolean);


		var error_data = d3.range(screeData['error'].length).map(function(d, i) {
			var rst = computeMeanStd(screeData.error[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), stability_data = d3.range(screeData.stability.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.stability[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), fit_data = d3.range(screeData.fit.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.fit[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), entropy_data = d3.range(screeData.entropy.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.entropy[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), normalized_entropy_data = d3.range(screeData.normalized_entropy.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.normalized_entropy[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), gini_data = d3.range(screeData.gini.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.fit[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), theil_data = d3.range(screeData.theil.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.theil[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), pctnonzeros_data = d3.range(screeData.pctnonzeros.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.pctnonzeros[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		})


		this.setState({
			factors_data: factors,
			descriptors_text: descriptors_text,
			bar_data: bar_data,      
			max_pattern_item: max_pattern_item,
			queries: queries,
			error_data: error_data,
			stability_data: stability_data,
			fit_data: fit_data,
			entropy_data: entropy_data,
			normalized_entropy_data: normalized_entropy_data,
			gini_data: gini_data,
			theil_data: theil_data,
			pctnonzeros_data: pctnonzeros_data
		});    
	}

	componentDidMount() {
		const { domain } = this.state;
		const selectedDataset = require("../../data/" + domain + "/factors_3_19" + "_sample_fit");

		this.setState({
			screeData: selectedDataset.scree,
			factors_data: selectedDataset.data,
			descriptors: selectedDataset.descriptors,
			descriptors_mean: selectedDataset.average,
			item_max_pattern: selectedDataset.item_max_pattern,
			item_similarity: selectedDataset.itemSimilarity,
			modes: selectedDataset.modes
		});
	}

	// depricated
	handleMouseOverPattern(idx){
		const { factors_data } = this.state,
			newMouseOverPatternIdx = idx;

		this.setState(prevState => ({
		  mouseOveredPatternIdx: newMouseOverPatternIdx,
		  mouseOveredPatternData: this.state.factors_data[idx]
		}));
	}
	// depricated
	handleMouseOutPattern(id){
		this.setState(prevState => ({
			mouseOveredPatternIdx: ''
		}));
	}


	handleClickPoint(rank) { 
		/**
		 * Handles the click events over the points in the control panel.
		 *
		 * Prepares data When users select one point. 
		 * 1) When user click on one point: 
		 * 	a) load the corresponding data file
		 * 2) Update the state.		 
		 *
		 * @since      0.0.0
		 *
		 * @fires   click
		 *
		 * @param {var}   idx           the rank.
		 * 
		 */
		var domain = this.state.domain;
		var new_data = require("../../data/"+domain+"/factors_3_" + rank.toString() + "_sample_fit");
		// var new_data = require("../../data/nbaplayer_factors_3_" + rank.toString() + "_sample_fit");


		let bar_data = {},
			max_pattern_item = {},
			descriptors_text = [],
			queries = d3.range(new_data.data[0].dims).reduce((obj, item) => {
				obj[item] = [];
				return obj;
			}, {});			

		new_data.data.forEach(function(d, id) {
			d.petals = d3.range(d.dims).map(function(i) { 
				return {
					"id": id, "length": 1 - d.factors[i].entropy,
					"width": d.factors[i].similarity.average
				}; 
			});
			d.circles = {
				"dominance": d.weight, 
				"radius": 6
			};     
		});	

		for(let i = 0; i < new_data.data[0].dims; i++){
			bar_data[i] = [];
			max_pattern_item[i] = [];
			let pattern_cnt = new_data.data.length;
			for(let j = 0; j < pattern_cnt; j++) {
				bar_data[i].push(new_data.data[j].factors[i].values); 
				max_pattern_item[i].push(new_data.data[j].factors[i].max_item);         
			}      
			bar_data[i].push(new_data.average[i]); 
		}

		for (let key in new_data.descriptors) {
			if (new_data.descriptors.hasOwnProperty(key)) {
				descriptors_text.push(key + '(' + new_data.descriptors[key].length + ')');
			}
		}
	
		this.setState(prevState => ({
			factors_data: new_data.data,
			descriptors: new_data.descriptors,
			descriptors_mean: new_data.average,
			item_max_pattern: new_data.item_max_pattern,
			item_similarity: new_data.itemSimilarity,
			bar_data: bar_data,      
			max_pattern_item: max_pattern_item,
			modes: new_data.modes,
			queries: queries,
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
		console.log("clicked:", idx);
		const newSelectedPattern = idx,
			factors = this.state.factors_data,
			tensor_dims = this.state.modes.length,			
			prev_selected_patterns = this.state.selectedPatterns,
			selectedPatternCnt = prev_selected_patterns.length + 1;

		console.log(this.state);

		let mostSimilarPattern = [],
			max_ids = [],
			min_ids = [],			
			bar_data_cur = this.state.bar_data;
			
	
		factors.forEach(function(d, id) {
			d.petals = d3.range(d.dims).map(function(i) { 
				return {
						"id": id, "length": 1 - d.factors[i].entropy,
						"width": d.factors[i].similarity[idx]
				}; 
			});
		});

		for(var i = 0; i < this.state.factors_data[0].dims; i++){
			max_ids.push(factors[idx].factors[i].similarity.max_idx);
			min_ids.push(factors[idx].factors[i].similarity.min_idx);
		}

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
			factors_data: factors,
			bar_data: bar_data_cur,
			arc_positions_bar_petal: extractPetalBarCoordinates(petals_path_items),
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
			factors = this.state.factors_data;

		factors.forEach(function(d, id) {
			d.petals = d3.range(d.dims).map(function(i) { 
				return {
					"id": id, "length": 1 - d.factors[i].entropy,
					"width": d.factors[i].similarity.average
				}; 
			});   
		});

		this.setState(prevState => ({
			selectedPatterns: prevState.selectedPatterns.filter((d) => d !== newSelectedPattern),
			currentSelectedPatternIdx: '',
			factors_data: factors
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
		const factors = this.state.factors_data,
			pattern_cnt = factors.length;
		// p(item1_descriptor1/pattern)*p(item2_descriptor1/pattern)*p(item3_descriptor2/pattern)*p(item4_descriptor3/pattern)
		let similarPatternToQueries = this.calculateSimilarityBtnPatternToQueries(pattern_cnt, new_queries, factors),
			pattern_idx,
			relevance_score,
			coordinates;


		similarPatternToQueries.sort(function(first, second) {
			return second[1] - first[1];
		}).slice(0, top_k);
		similarPatternToQueries = d3.range(top_k).map(function(i){
			return {
					"rank": i,
					"pattern_idx": similarPatternToQueries[i][0],
					"relevance_score":similarPatternToQueries[i][1],
					"tsne_coord":factors[similarPatternToQueries[i][0]].tsne_coord
				};
		});

		this.setState({
			queries:new_queries,
			similarPatternToQueries: similarPatternToQueries
		});
	}

	calculateSimilarityBtnPatternToQueries(pattern_cnt, new_queries, all_factors) {
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
						return all_factors[i].factors[key].values[queryKey];
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
	handleMouseOverItem(descriptor_index, key, q_bar_start, items){
		/**
		 * Handles the mouseover items events.
		 *
		 *
		 * 1) Compute the coordinates of the bar_start (mouseovered item) and the bar_end (top similar items) 
		 * 2) return in the format of function drawQuadratic input
		 *
		 * @since       0.0.0
		 * @param {var} descriptor_index  the descriptor_index that is being mouse overed
		 * @param {var} key  the item key that is being mouse overed
		 * @param {var} q_bar_start  the path of the key being mouse overed
		 * @param {object} items  the dictionary that contains the path of the similar items
		 * 
		 */		

		this.setState(prevState => ({
			item_links: extractItemCoordinates(q_bar_start, items),
			mouseOveredDescriptorIdx: descriptor_index
		}));

	}
	handleMouseOutItem(){
		/**
		 * Handles the mouseout items events.
		 *
		 * reset the data
		 * 
		 */			
		this.setState(prevState => ({
			item_links: [],
			mouseOveredDescriptorIdx: ''
		}));
	}

	handleChangeDataset(selectedDomain) {
		console.log('handleChangeDataset: ', selectedDomain);
		const selectedDataset = require("../../data/" + selectedDomain + "/factors_3_19" + "_sample_fit.json"),
					metrics = require("../../data/" + selectedDomain + "/factors_3_19" + "_sample_fit_metrics.json");
		console.log('handleChangeDataset: ', selectedDataset);

		const _self = this,
					factors = selectedDataset.data,
					screeData = metrics,
					start_index = 2,
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
					"id": id, "length": 1 - d.factors[i].entropy,
					"width": d.factors[i].similarity.average
				}; 
			});
			d.circles = {
				"dominance": d.weight, 
				"radius": 6
			};     
		});

		for(let i = 0; i < factors[0].dims; i++){
			bar_data[i] = [];
			max_pattern_item[i] = [];
			let pattern_cnt = factors.length;
			for(let j = 0; j < pattern_cnt; j++) {
				bar_data[i].push(factors[j].factors[i].values); 
				max_pattern_item[i].push(factors[j].factors[i].max_item);         
			}      
			bar_data[i].push(this.state.descriptors_mean[i]); 
		}

		for (let key in this.state.descriptors) {
			if (this.state.descriptors.hasOwnProperty(key)) {
				descriptors_text.push(key + '(' + this.state.descriptors[key].length + ')');
			}
		}


		// compute scree data
		screeData['error'] = screeData['error'].filter(Boolean);
		screeData['stability'] = screeData['stability'].filter(Boolean);
		screeData['fit'] = screeData['fit'].filter(Boolean);
		screeData['entropy'] = screeData['entropy'].filter(Boolean);
		screeData['normalized_entropy'] = screeData['normalized_entropy'].filter(Boolean);
		screeData['gini'] = screeData['gini'].filter(Boolean);
		screeData['theil'] = screeData['theil'].filter(Boolean);
		screeData['pctnonzeros'] = screeData['pctnonzeros'].filter(Boolean);

		var error_data = d3.range(screeData['error'].length).map(function(d, i) {
			var rst = computeMeanStd(screeData.error[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), stability_data = d3.range(screeData.stability.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.stability[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), fit_data = d3.range(screeData.fit.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.fit[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), entropy_data = d3.range(screeData.entropy.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.entropy[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), normalized_entropy_data = d3.range(screeData.normalized_entropy.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.normalized_entropy[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), gini_data = d3.range(screeData.gini.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.fit[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), theil_data = d3.range(screeData.theil.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.theil[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		}), pctnonzeros_data = d3.range(screeData.pctnonzeros.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.pctnonzeros[d]);
			return {"x": d+start_index, "y": rst[0], "e":rst[1]};
		})

		this.setState({
			domain: selectedDomain,
			screeData: selectedDataset.scree,
			factors_data: selectedDataset.data,
			descriptors: selectedDataset.descriptors,
			descriptors_mean: selectedDataset.average,
			item_max_pattern: selectedDataset.item_max_pattern,
			item_similarity: selectedDataset.itemSimilarity,
			modes: selectedDataset.modes,
			descriptors_text: descriptors_text,
			bar_data: bar_data,      
			max_pattern_item: max_pattern_item,
			queries: queries,
			error_data: error_data,
			stability_data: stability_data,
			fit_data: fit_data,
			entropy_data: entropy_data,
			normalized_entropy_data: normalized_entropy_data,
			gini_data: gini_data,
			theil_data: theil_data,
			pctnonzeros_data: pctnonzeros_data
		});
	}

  render() {
	if (!this.state.bar_data || this.state.bar_data.length === 0)
	  return <div />

	const { factors_data, bar_data, descriptors_mean,
			selectedPatterns, mouseOveredPattern, modes,			
			mostSimilarPatternToSelectedPatternIdx,leastSimilarPatternToSelectedPatternIdx,
			descriptors, descriptors_text,screeData, max_pattern_item, arc_positions_bar_petal, 
			item_max_pattern,queries,similarPatternToQueries, item_links, mouseOveredDescriptorIdx, 
			item_similarity, error_data, stability_data,  fit_data, entropy_data, normalized_entropy_data,
			gini_data, theil_data, pctnonzeros_data, datasets, domain
		} = this.state;


	const components_cnt = factors_data.length;

	console.log('domain: ', this.state.domain);

	return (
	  <div className={styles.App}>
		<header className={styles.header}>
		  <div className={styles.title}>iFac</div>
			<div>Tensor Pattern Exploration</div>
		</header>
		<div>
			<ControlView
				components_cnt={components_cnt}
				descriptors_text={descriptors_text}				
				error_data={error_data}
				stability_data={stability_data}
				fit_data={fit_data}								
				entropy_data={entropy_data}								
				normalized_entropy_data={normalized_entropy_data}								
				gini_data={gini_data}								
				theil_data={theil_data}								
				pctnonzeros_data={pctnonzeros_data}												
				onClickPoint={this.handleClickPoint}
				datasets={datasets}	
				domain={domain}
				onChangeDataset={this.handleChangeDataset}			
			/>
			<div className={styles.rowC}>
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
					item_links={item_links}
					mouseOveredDescriptorIdx={mouseOveredDescriptorIdx}
					similarPatternToQueries={similarPatternToQueries}
			  />          
				<DetailView
					bar_data={bar_data}				
					selectedPatterns={selectedPatterns}
					components_cnt={components_cnt}
				/>
			</div>
		</div>
	  </div>
	);
  }
}

export default App;
