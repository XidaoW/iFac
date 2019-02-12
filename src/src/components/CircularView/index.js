import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import d3tooltip from 'd3-tooltip';
import {scaleRadial} from '../../lib/draw_radial.js';
import * as quadPath from '../../lib/draw_quadratic_path.js';
import * as petal from '../../lib/draw_petals.js';

import _ from 'lodash';
import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)
import Circos, { SCATTER } from 'react-circos';
import { Tag, Input, Tooltip, Icon, Button } from 'antd';

import QueryPannel from 'components/QueryPannel';

const tooltip = d3tooltip(d3);

/* props: this.props.ranking
  => selected ranking data
*/

class CircularView extends Component {
  
	constructor(props) {
		super(props);
		this.layout = {
			width: 850,
			height: 850,
			svg: {
				width: 850,
				height: 950
			},
			detailView: {
				margin: {
					top: gs.detailViewMarginTop,
					bottom: gs.detailViewMarginBottom,
					left: gs.detailViewMarginLeft,
					right: gs.detailViewMarginRight
				}
			},
			dimRed: {
				width: 150,
				height: 150
			}
		};

		this.pie;	
		this.circle_position_x;
		this.circle_position_y;
		this.svg;
		this.circle_color;
		this.circle_width;
		this.compare_N = 2;
		this.outerCircleRadius = parseInt(gs.outerCircleRadius);
		this.innerCircleRadius = parseInt(gs.innerCircleRadius);
		this.innerCircleStrokeWidth = parseInt(gs.innerCircleStrokeWidth);
		this.innerCircleStrokeOpacity = parseInt(gs.innerCircleStrokeOpacity);
		this.outerCircleStrokeWidth = parseInt(gs.outerCircleStrokeWidth);
		this.outerCircleStrokeOpacity = parseInt(gs.outerCircleStrokeOpacity);

		this.detailViewMarginTop = gs.detailViewMarginTop;
		this.detailViewMarginBottom = gs.detailViewMarginBottom;
		this.detailViewMarginLeft = gs.detailViewMarginLeft;
		this.detailViewMarginRight = gs.detailViewMarginRight;
		this.backgroundBarOpacity = gs.detailViewBKBarOpacity;
		this.foregroundBarOpacity = gs.detailViewFGBarOpacity;
		this.circularInnerRadius = gs.circularInnerRadius;
		this.barLabelFontSize = gs.barLabelFontSize;
		this.handleResetPatterns = this.handleResetPatterns.bind(this);				
		this.handleResetItems = this.handleResetItems.bind(this);				
	}

	handleResetPatterns() {
		d3.selectAll('.pattern_circles').classed('selected', false);                                       
		d3.selectAll('.pattern_circles').attr('stroke', 'none');
		this.props.onResetPatterns();
	}
	handleResetItems() {
		d3.selectAll('.query_bar').classed('queried', false)	
		d3.selectAll('.query_bar').attr("stroke", "none");
		this.props.onResetItems();
	}

	render() {
		console.log('circularView rendered');
		console.log('this.props.data: ', this.props.data);

		const { data, selectedPatterns,
				mostSimilarPatternToSelectedPatternIdx,
				leastSimilarPatternToSelectedPatternIdx, 
				arc_positions_bar_petal,item_max_pattern,
				bar_data, max_pattern_item,components_cnt,modes,
				queries, similarPatternToQueries, item_links, descriptors,
				mouseOveredDescriptorIdx, item_similarity, 
				itemEmbeddings } = this.props;  

		const ButtonGroup = Button.Group;
		const _self = this,
					width = +this.layout.svg.width,
					height = +this.layout.svg.height,
					outerRadius = Math.min(width, height) - 0,
					innerRadius = this.circularInnerRadius,
					max_tsne = data[0].max_tsne,
					min_tsne = data[0].min_tsne,
					barFillOpacityConst = 0.5, 
					query_flag = (Object.keys(queries).length == 0)? false: Object.keys(queries).map(function(key){			
						return queries[key].length;
					}).reduce((a,b)=>a+b);			



		let	descriptor_size = Object.keys(bar_data).length,
			descriptor_size_list = Object.keys(itemEmbeddings).map((d) => itemEmbeddings[d].length),		
			color_list = ['#ffff99', '#beaed4'],
			used_color = '',
			shift_size = 0.1,
			label_flag = false,
			reorder_item = false,
			translate_x = 0,
			translate_y = 0,
			top_k = 5;

		let g,
			svg = new ReactFauxDOM.Element('svg');

		svg.setAttribute('width', width);
		svg.setAttribute('height',height);
		svg.setAttribute('transform', 'translate(' + translate_x + ',' + translate_y + ')');

		this.pie = d3.pie().sort(null).value((d) => 1);
		this.circle_color = d3.scaleLinear().domain([0, 1]).range(['#bf5b17','#e31a1c']).interpolate(d3.interpolateHcl);
		this.circle_width = d3.scaleLinear().domain([0, 1]).range([1,2]);
		this.circle_position_x = d3.scaleLinear().domain([min_tsne[0],max_tsne[0]]).range([- 0, + innerRadius]);
		this.circle_position_y = d3.scaleLinear().domain([min_tsne[1],max_tsne[1]]).range([- 0, + innerRadius]);

		// Update the list of available colors to pick for clicking patterns
		for(var i = 0; i < selectedPatterns.length; i++){
			used_color = d3.select('#pattern_' + selectedPatterns[i]).attr('stroke');   
			color_list.splice( color_list.indexOf(used_color), 1 );
		}

		// draw the backdrop
		const backdrop = d3.select(svg)
						.append('g')
						.attr('class', 'background')
						.attr('transform', 'translate(50,50)'),
					gFlowers = backdrop
						.append('g')
						.attr('transform', 'translate(' + ((width)/2-(innerRadius)/2) + ',' + ((height)/2-( innerRadius)/2) + ')')
						.attr('class', 'g_flowers');

		// remove the lines between patterns and dominating items.
		// questionable functions
		backdrop.selectAll('path.line_pointer').remove();

		// Add the outer circles to the backdrop.
		const circles = gFlowers.selectAll('.circle')
						.data(data)
						.enter()
						.append('circle')
						.attr('class', 'pattern_circles')
						.attr('r', gs.innerCircleRadius)
						.attr('fill', '#fc8d12')
						.attr('stroke-width', gs.innerCircleStrokeWidth)                
						.attr('fill-opacity', (d) => d.weight) 
						.attr('stroke-opacity', gs.innerCircleStrokeOpacity)
						.attr('id', (d) => 'pattern_' + d.id)                
						.attr('transform', (d, i) => 'translate(' + _self.circle_position_x(d.tsne_coord.x) + ',' 
									+ _self.circle_position_y(d.tsne_coord.y) + ')')
						.on("mouseover", function(d){
							tooltip.html('<div>pattern#' + d.id + '</div>'+ 
								'<div>dominance: ' + d3.format(".0%")(d.weight) + '</div>');
							tooltip.show();
						})
						.on("mouseout", function(d){
							tooltip.hide();
						})									
						.on('click', (d) => {
							if (d3.select('#pattern_' + d.id).classed('selected')) {
								_self.props.onUnClickPattern(d.id);
								let cancel_color = d3.select('#pattern_' + d.id).attr('stroke');
								d3.select('#pattern_' + d.id).classed('selected', false);                                       
								d3.select('#pattern_' + d.id).attr('stroke', 'none');
								// remove the lines between patterns and the dominating items.
								for(let descriptor_index = 0; descriptor_index < descriptor_size; descriptor_index++){
									backdrop.select('path#link_'+descriptor_index).remove();
								}								
							} else {
								if (selectedPatterns.length < this.compare_N) {
									let petals_path_items = d3.range(descriptor_size).map(function(p){
										return {
											'd_flower': backdrop.select('path#petal_'+d.id+'_'+p+'.petal').attr('d'),
											'transform_petal': backdrop.select('path#petal_'+d.id+'_'+p+'.petal').attr('transform'),
											'translate_flower': backdrop.select('#flower_'+d.id).attr('transform'),
											'transform_bar': backdrop.select('g#descriptor_'+p+'_barchart').attr('transform'),
											'transform_g_flower': backdrop.select('g.g_flowers').attr('transform'),
											'd_bar': backdrop.select('path#bar_'+p+'_'+max_pattern_item[p][d.id]).attr('d'),
											'item': max_pattern_item[p][d.id],
											'descriptor_index': p,
											'pattern_id': d.id
										}
									});
									_self.props.onClickPattern(d.id, petals_path_items);
									d3.select('#pattern_' + d.id).classed('selected', true);							
									d3.select('#pattern_' + d.id).attr('stroke', color_list[0]);    							
									color_list.splice(0, 1);
								}
							}
						});

		// plot the flowers
		const flowers = gFlowers.selectAll('.flower')
						.data(data)
						.enter()
						.append('g')
						.attr('class', 'flower')
						.attr('id', (d) => 'flower_' + d.id)
						.attr('transform', (d, i) => 'translate(' + _self.circle_position_x(d.tsne_coord.x) + ',' 
									+ _self.circle_position_y(d.tsne_coord.y) + ')');
		// add the petals to the flowers
		const petals = flowers.selectAll('.petal')
					.data((d) => this.pie(d.petals))
					.enter()
					.append('path')
					.attr('class', 'petal')
					.attr('id', (d) => 'petal_'+d.data.id+'_' + d.index)
					.attr('transform', (d) => petal.rotateAngle((d.startAngle + d.endAngle) / 2))
					.attr('d', (d) => petal.petalPath(d, this.outerCircleRadius))
					.style('stroke', (d, i) => 'gray')
					.attr('stroke-width', function(d) {   
					})
					.attr('stroke', function(d) {   
					})
					.on("mouseover", function(d, i){
						tooltip.html('<div>descriptor#' + d.data.id +"(" + i + ")" + '</div>'+ 
							'<div>informativeness: ' + d3.format(".0%")(d.data.length) + '</div>' +
							'<div>similarity: ' + d3.format(".0%")(d.data.width) + '</div>');
						tooltip.show();
					})
					.on("mouseout", function(d){
						tooltip.hide();
					})
					.style('fill', (d, i) => petal.petalFill(d, i, descriptor_size))
					.style('fill-opacity', 0.6);

		// DRAW THE RADIAL BAR CHART
		for(let descriptor_index = 0; descriptor_index < descriptor_size; descriptor_index++){
			let selected_pattern_cnt = selectedPatterns.length;
			
			// when selected more than one pattern, show the distribution of selected patterns.
			if(selected_pattern_cnt > 0) {
				draw_bars_circular(bar_data, descriptor_index, max_pattern_item, selectedPatterns, descriptor_size, descriptor_size_list, this.layout.detailView.margin, width, height);
				// only show the line pointer (dominating items) when one pattern is selected.
				if (selected_pattern_cnt == 1) {
					draw_line_pointer(descriptor_index, arc_positions_bar_petal);
				}
			}else{
				// draw the bar for the default values that show the average of the patterns.
				draw_bars_circular(bar_data, descriptor_index, max_pattern_item, [components_cnt], descriptor_size, descriptor_size_list, this.layout.detailView.margin, width, height);
			}
			// when two patterns are selected for comparison, the query bar also needs to or-ordered. 
			reorder_item = (selected_pattern_cnt == 2)? true : false;
			draw_query_circular(bar_data, descriptor_index, max_pattern_item, [components_cnt], descriptor_size, descriptor_size_list, this.layout.detailView.margin, width, height, reorder_item = reorder_item);

			// draw_embedding_circular(itemEmbeddings, descriptor_index, [components_cnt], descriptor_size, descriptor_size_list, this.layout.detailView.margin, width, height)
			

		}

		draw_query_result(similarPatternToQueries, query_flag);

		function draw_query_result(similarPatternToQueries, query_flag){
			/**
			 * Draws the query result on to the patterns.
			 *
			 * if there is query input, draws the query output in terms of rankings as text to center of the flowers.
			 * otherwise, remove the ranking text.
			 *
			 * @since      0.0.0
			 *
			 *
			 * @param {array}   similarPatternToQueries           a ranked list of similarity between pattern and query.
			 * @param {boolean}  query_flag     if there is query input.
			 * 
			 */			
			if(query_flag){
				gFlowers.selectAll(".rankText")
						.data(similarPatternToQueries)
						.enter()
						.append('text')
						.attr('transform', (d, i) => 'translate(' + (_self.circle_position_x(d.tsne_coord.x)-5) + ',' 
									+ (_self.circle_position_y(d.tsne_coord.y)+5) + ')')
	                	.text((d) => (d.rank+1).toString());
			}else{
				d3.select(".rankText").remove();
			}

		}


		function draw_line_pointer(descriptor_index, arc_positions_bar_petal){
			/**
			 * Draws the line between flower and the bar to identify the dominating items.
			 *
			 * @since      0.0.0
			 *
			 * @param {var}   descriptor_index       the descriptor index.
			 * @param {object}  arc_positions_bar_petal     the coordiates of the start and end.
			 * 
			 */			
			let line = d3.line()
						.x((d) => d.x)
						.y((d) => d.y);

			let pattern_item_line = gFlowers.append('path')
					.attr('class', 'line_pointer')
					.attr('stroke', 'grey')
					.attr('stroke-width', 2)
					.attr('stroke-dasharray', '1,5')
					.attr('fill', 'none')		
					.attr('id', 'link_'+descriptor_index)					
					.attr('d', line(arc_positions_bar_petal[descriptor_index].coordinates));	
		}



		function draw_embedding_circular(itemEmbeddings, descriptor_index, patternIndices, descriptor_size, descriptor_size_list, margin, width, height){
					/**
					 * Draws the circular area of scatter points for each descriptor - embeddings of the items
					 *
					 * 1) obtain the bar data for the selected patterns.
					 * 3) draw arc bars
					 * 4) add labels
					 * otherwise, remove the ranking text.
					 *
					 * @since      0.0.0
					 *
					 *
					 * @param {array}   similarPatternToQueries           a ranked list of similarity between pattern and query.
					 * @param {boolean}  query_flag     if there is query input.
					 * 
					 */					
					let patterns, items, items1, descriptor_arcs;
					let cur_embeddings = itemEmbeddings[descriptor_index];
					let x_max = d3.max(cur_embeddings, (d) => d[0]);
					let y_max = d3.max(cur_embeddings, (d) => d[1]);
					let x_min = d3.min(cur_embeddings, (d) => d[0]);
					let y_min = d3.min(cur_embeddings, (d) => d[1]);

					cur_embeddings = cur_embeddings.sort((first, second) => second[0] - first[0]);					
					let x_items = d3.range(cur_embeddings.length).map((d) => cur_embeddings[d][0]);
			
					// X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
					const x = d3.scaleLinear()
									.range(computeDescriptorRange(descriptor_index, descriptor_size, descriptor_size_list, 0.1))    
									.domain(x_items), // The domain of the X axis is the list of states.
								y = scaleRadial()
									.range([outerRadius, outerRadius+5])   // Domain will be define later.
									.domain([y_min, y_max]), // Domain of Y is from 0 to the max seen in the data
								g = backdrop.append('g')
									.attr('class', 'embeddingView')
									.attr('id', 'descriptor_'+descriptor_index+'_embedding')          
									.attr('transform', 'translate(' + (width / 2) + ',' + ( height/2 )+ ')'); 

			// descriptor_arcs = g.selectAll('g')
			// 				.select('#descriptor' + descriptor_index)
			// 				.data(cur_embeddings)
			// 				.enter()                                    
			// 				.selectAll('path')
			// 				.data((d,cur_index) => {
			// 					return cur_embeddings.map((point, i) => {
			// 						return {key: point[0], value: point[1], id: i, index: cur_index};
			// 					})})
			// 				.enter();
			// // Add the bars
			// descriptor_arcs.append('path')
			// 		.attr('d', d3.arc()     // imagine your doing a part of a donut plot
			// 		.innerRadius(innerRadius)
			// 		.outerRadius((d) => {console.log(y(d.value)); return y(d.value)})
			// 		.startAngle((d) => x(d.key) + x.bandwidth()*(d.index)/1)
			// 		.endAngle((d) => x(d.key) + x.bandwidth()*(d.index+1)/1)
			// 		.padAngle(0.01)
			// 		.padRadius(innerRadius))
			// 		.attr('fill', "#beaed4")					
			// 		.attr('id', (d)=> 'bar_' + descriptor_index + '_' + d.key)
			// 		.attr('stroke', 'black')
			// 		.attr('stroke-width', "0px");
				}


		function draw_bars_circular(bar_data, descriptor_index, max_pattern_item, patternIndices, descriptor_size, descriptor_size_list, margin, width, height){
			/**
			 * Draws the circular bar for each descriptor
			 *
			 * 1) obtain the bar data for the selected patterns.
			 * 2) re-order the items if two patterns are selected for comparison.
			 * 3) draw arc bars
			 * 4) add labels
			 * otherwise, remove the ranking text.
			 *
			 * @since      0.0.0
			 *
			 *
			 * @param {array}   similarPatternToQueries           a ranked list of similarity between pattern and query.
			 * @param {boolean}  query_flag     if there is query input.
			 * 
			 */					
			let patterns, items, items1, descriptor_arcs;
			
			patterns = patternIndices.map((pattern_id) => bar_data[descriptor_index][pattern_id]);
			items = Object.keys(bar_data[descriptor_index][components_cnt]).filter((d) => d !== 'id').sort();
			if(patterns.length == 2){
				// re-ordering the items based on the difference between the two patterns on each descriptor.
				items1 = Object.keys(bar_data[descriptor_index][components_cnt+1])
								.filter((d) => d !== 'id')
								.map((key) => [key, bar_data[descriptor_index][components_cnt+1][key]])
								.sort((first, second) => second[1] - first[1]);
				items = items1.map((key) => key[0]);				
			}
			// X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
			const x = d3.scaleBand()
							.range(computeDescriptorRange(descriptor_index, descriptor_size, descriptor_size_list, 0.1))    
							.domain(items) // The domain of the X axis is the list of states.
							.paddingInner(0.05),
						y = scaleRadial()
							.range([innerRadius, outerRadius])   // Domain will be define later.
							.domain([0, 3]), // Domain of Y is from 0 to the max seen in the data
						bar_opacity = d3.scaleLinear()
							.range([0, 0.8])
							.domain([0, d3.max(patterns, (d) =>
								d3.max(items, (key) => d[key])) ]
							);
						g = backdrop.append('g')
							.attr('class', 'detailView')
							.attr('id', 'descriptor_'+descriptor_index+'_barchart')          
							.attr('transform', 'translate(' + (width / 2) + ',' + ( height/2 )+ ')'); 

			descriptor_arcs = g.selectAll('g')
							.select('#descriptor' + descriptor_index)
							.data(patterns)
							.enter()                                    
							.selectAll('path')
							.data((d,cur_index) => 
								items.map((key) => (
									{key: key, value: d[key], id: d.id, index: cur_index}
								)))
							.enter()
			// Add the bars
			descriptor_arcs.append('path')
					.attr('d', d3.arc()     // imagine your doing a part of a donut plot
					.innerRadius(innerRadius)
					.outerRadius((d) => y(d.value))
					.startAngle((d) => x(d.key) + x.bandwidth()*(d.index)/patterns.length)
					.endAngle((d) => x(d.key) + x.bandwidth()*(d.index+1)/patterns.length)
					.padAngle(0.01)
					.padRadius(innerRadius))
					.attr('id', (d)=> 'bar_' + descriptor_index + '_' + d.key)
					.attr('fill', (d) => barFill(d, descriptor_index, descriptor_size, bar_opacity))
					.attr('opacity', (d) => barFillOpacity(d, descriptor_index, descriptor_size, _self.foregroundBarOpacity, _self.backgroundBarOpacity,bar_opacity))       
					.attr('stroke', 'black')
					.attr('stroke-width', "0px")
					.on("mouseover", function(d){
						// d3.selectAll("circle.rank"+d.x.toString()).attr("stroke", "#ffab00");
						// d3.selectAll("circle.rank"+d.x.toString()).attr("stroke-width", "6px");

						tooltip.html('<span>' + d.key + "(" + d3.format(".0%")(d.value) + ")"+ '</span>');
						tooltip.show();

					})
					.on("mouseout", function(d){
						// d3.selectAll("circle.rank"+d.x.toString()).attr("stroke", "none");
						tooltip.hide();
					})			


			// Add the labels     
			backdrop.selectAll("text.label_bar" + descriptor_index).remove();
			var draw_label = false;
			if(draw_label){
				descriptor_arcs.append('g')
					.attr('class', 'descriptor_text' + descriptor_index)
					.attr('text-anchor', (d) => (x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length + Math.PI) % (2 * Math.PI) < Math.PI ? 'end' : 'start')
					.attr('transform', (d) => 'rotate(' + ((x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length) * 180 / Math.PI - 90) + ')'+'translate(' + (y(d.value)+20) + ',0)')
					.append('text')
					.text((d) => d.key)
					.attr('transform', (d) => (x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length + Math.PI) % (2 * Math.PI) < Math.PI ? 'rotate(180)' : 'rotate(0)')
					.style('font-size', '10px')
					.attr('id', (d) => 'label_' + descriptor_index + '_' + d.key)
					.attr('class', 'label_bar' + descriptor_index)
					.attr('alignment-baseline', 'middle');						
			}
	
		}

		function draw_query_circular(bar_data, descriptor_index, max_pattern_item, patternIndices, descriptor_size, descriptor_size_list, margin, width, height, reorder_item = false){
			/**
			 * Draws the circular bar for input query and visualize item similarity
			 *
			 * 1) obtain the bar data for the selected patterns.
			 * 2) re-order the items if two patterns are selected for comparison.
			 * 3) draw arc bars and attach click and mouseover events
			 * 4) draw the link between items
			 * otherwise, remove the ranking text.
			 *
			 * @since      0.0.0
			 *
			 *
			 * @param {array}   similarPatternToQueries           a ranked list of similarity between pattern and query.
			 * @param {boolean}  query_flag     if there is query input.
			 * 
			 */				
			let patterns, items, items1, descriptor_arcs, query_bar;
			
			patterns = patternIndices.map((pattern_id) => bar_data[descriptor_index][pattern_id]);
			items = Object.keys(bar_data[descriptor_index][components_cnt]).filter((d) => d !== 'id').sort();

			if(reorder_item){
				items1 = Object.keys(bar_data[descriptor_index][components_cnt+1])
								.filter((d) => d !== 'id')
								.map((key) => [key, bar_data[descriptor_index][components_cnt+1][key]])
								.sort((first, second) => second[1] - first[1]);
				items = items1.map((key) => key[0]);	
			}	
			// X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
			const x = d3.scaleBand()
							.range(computeDescriptorRange(descriptor_index, descriptor_size, descriptor_size_list, 0.1))    
							.domain(items) // The domain of the X axis is the list of states.
							.paddingInner(0.05),
						y = scaleRadial()
							.range([innerRadius-20, innerRadius])   // Domain will be define later.
							.domain([0, 3]), // Domain of Y is from 0 to the max seen in the data
						bar_opacity = d3.scaleLinear()
							.range([0, 1])
							.domain([0, d3.max(patterns, (d) =>
								d3.max(items, (key) => d[key])) ]
							),
						line_width = d3.scaleLinear()
							.range([0, 2])
							.domain([0, 1]),
						g = backdrop.append('g')
							.attr('class', 'queryView')
							.attr('id', 'query_'+descriptor_index+'_barchart')          
							.attr('transform', 'translate(' + (width / 2) + ',' + ( height/2 )+ ')'); 

			descriptor_arcs = g.selectAll('g')
							.select('#query' + descriptor_index)
							.data(patterns)
							.enter()                                    
							.selectAll('path')
							.data((d,cur_index) => 
									items.map((key) => (
										{key: key, value: d[key], id: d.id, index: cur_index}
									)))
							.enter()
			// Add the bars
			query_bar = descriptor_arcs.append('path')
					.attr('d', d3.arc()     // imagine your doing a part of a donut plot
					.innerRadius(innerRadius-10)
					.outerRadius((d) => y(0))
					.startAngle((d) => x(d.key) + x.bandwidth()*(d.index)/patterns.length)
					.endAngle((d) => x(d.key) + x.bandwidth()*(d.index+1)/patterns.length)
					.padAngle(0.01)
					.padRadius(innerRadius-10))
					.attr('class', (d) => 'query_bar query_' + descriptor_index)
					.attr('id', (d)=> 'query_bar_' + descriptor_index + '_' + d.key)
					.attr('fill', (d) => barFill(d, descriptor_index, descriptor_size, bar_opacity))
					.attr('opacity', barFillOpacityConst)       
					.attr('stroke', 'none')
					.attr('stroke-width', '3px')
					.on('click', (d) => {
						if (d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).classed('queried')) {
							queries[descriptor_index].pop(d.key);
							_self.props.onClickItem(queries, top_k);							
							d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("stroke", "none");							
							d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).classed('queried', false);							
						} else {
							console.log(queries);
							if(!(descriptor_index in queries)){
								queries[descriptor_index] = [];	
							}
							queries[descriptor_index].push(d.key);							
							_self.props.onClickItem(queries, top_k);
							d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("stroke", "black");
							d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).classed('queried', true);
						}						
					})
					.on('mouseover', (d) => {
						d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("opacity",1);
						Object.keys(item_similarity[descriptor_index][d.key]).map(function(key){										
							d3.select('#query_bar_' + descriptor_index+ '_'+ key).attr("opacity", item_similarity[descriptor_index][d.key][key]);
						});
						var cur_key_idx = Object.keys(item_similarity[descriptor_index]).indexOf(d.key);
						const top_k_item = 5;
						// Create items array
						var top_items = Object.keys(item_similarity[descriptor_index][d.key]).map((key) => {
							return [key, item_similarity[descriptor_index][d.key][key]];
						});
						// Sort the array based on the second element
						top_items.sort(function(first, second) {
							return second[1] - first[1];
						});	
						top_items = top_items.slice(0, top_k_item);
						let bars_item = top_items.map((key) => {
							return {
								'transform_bar': backdrop.select('g#query_'+descriptor_index+'_barchart').attr('transform'),
								'q_bar_end': backdrop.select('path#query_bar_'+descriptor_index+'_'+key[0]).attr('d'),
								'transform_g_flower': backdrop.select('g.g_flowers').attr('transform'),
								'key': key[0],
								'idx': cur_key_idx,
								'item_cnt': Object.keys(item_similarity[descriptor_index][d.key]).length+1,
								'similarity': item_similarity[descriptor_index][d.key][key[0]]
							}
						}),q_bar_start = backdrop.select('path#query_bar_'+descriptor_index+'_'+d.key).attr('d');

						_self.props.onMouseOverItem(descriptor_index, d.key, q_bar_start, bars_item);

					})
					.on('mouseout', (d) => {
						d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("opacity",barFillOpacityConst);
						// d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("stroke","none");
						Object.keys(item_similarity[descriptor_index][d.key]).map(function(key){										
							d3.select('#query_bar_' + descriptor_index+ '_'+ key).attr("opacity", barFillOpacityConst);
						});
						_self.props.onMouseOutItem();
					});			

			var link_opacity = d3.scaleLinear()
							.range([barFillOpacityConst, 1]).domain([d3.min(item_links, (d) => d.similarity), d3.max(item_links, (d) => d.similarity)]);
			for(let link_id = 0; link_id < item_links.length; link_id++){								
				if(item_links[link_id].similarity > 0){
					quadPath.drawQuadratic(gFlowers, item_links[link_id], axisStroke(mouseOveredDescriptorIdx, descriptor_size), link_opacity);
				}								
			}

		}		

		function axisStroke(i, descriptor_size) {
			var color_list = ["#85D4E3", "#F4B5BD", "#9C964A", "#CDC08C", "#FAD77B"]
			return color_list[i]
			// return d3.hcl(i / descriptor_size * 360, 60, 70);
		};

		function computeDescriptorRange(descriptor_index, descriptor_size,descriptor_size_list, shift_size){
			var total_size = 2*Math.PI/descriptor_size,
				max_item_cnt = d3.max(descriptor_size_list),
				each_value = total_size*1. / max_item_cnt,
				total_value_current = each_value * descriptor_size_list[descriptor_index],
				start_value = 2*Math.PI*(descriptor_index+1)/descriptor_size + shift_size + (total_size - total_value_current) / 2.0,
				end_value = 2*Math.PI*(descriptor_index+2)/descriptor_size - (total_size - total_value_current) / 2.0;
			return [start_value,  end_value];	
		}  

		function barFill(d, descriptor_index, descriptor_size, bar_opacity) {
			if(d.id >= components_cnt){
				return axisStroke(descriptor_index, descriptor_size);
			}  
			let cur_color  = d3.select('#pattern_' + d.id).attr('stroke'),       
				color_dark = d3.rgb(cur_color).darker(0.5),
				color_light = d3.rgb(cur_color).brighter(0.5),
				color_pick = d3.scaleLinear().domain([0, 1]).range([color_light,color_dark]);

			return cur_color;
			// return color_pick(bar_opacity(d.value));
		}
		function barFillOpacity(d, descriptor_index, descriptor_size, foregroundBarOpacity, backgroundBarOpacity,bar_opacity) {
			return (d.id >= components_cnt)? barFillOpacityConst : 1;
		};

		return (
			<div className={styles.CircularOverview}>					
				<div className={index.title}>Circular View
					<Tooltip title="Pattern Examination">
    					<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
  					</Tooltip>					
				</div>
				 <ButtonGroup>
					<Button onClick={this.handleResetPatterns}>
						Reset Pattern Selection
					</Button>
					<Button onClick={this.handleResetItems}>
						Reset Item Selection
					</Button>
					</ButtonGroup>
					<QueryPannel
						descriptors={descriptors}
						components_cnt={components_cnt}
						modes={modes}
						queries={queries}
					/>
				{svg.toReact()}				
			</div>
		);
  }
}

export default CircularView;