import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import {scaleRadial} from '../../lib/draw_radial.js'


import * as petal from '../../lib/draw_petals.js'

import _ from 'lodash';
import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)


/* props: this.props.ranking
  => selected ranking data
*/
class CircularView extends Component {
  
	constructor(props) {
		super(props);
		this.layout = {
			width: 1050,
			height: 1050,
			svg: {
				width: 1050,
				height: 1050
			},
			detailView: {
				margin: {
					top: gs.detailViewMarginTop,
					bottom: gs.detailViewMarginBottom,
					left: gs.detailViewMarginLeft,
					right: gs.detailViewMarginRight
				}
			}
		};

	this.pie;	
	this.petals;	
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

  }


  render() {
		const { data, selectedPatterns,
				mostSimilarPatternToSelectedPatternIdx,
				leastSimilarPatternToSelectedPatternIdx, 
				arc_positions_bar_petal,item_max_pattern,
				bar_data, max_pattern_item,components_cnt,modes,
				queries, similarPatternToQueries, item_similarity } = this.props;        
		const width = +this.layout.svg.width - this.layout.detailView.margin.left - this.layout.detailView.margin.right,
					height = +this.layout.svg.height - this.layout.detailView.margin.top - this.layout.detailView.margin.bottom;

		const query_flag = Object.keys(queries).map(function(key){			
			return queries[key].length;
		}).reduce((a,b)=>a+b);

		const outerRadius = Math.min(width, height) - 0,
			innerRadius = this.circularInnerRadius,
			max_tsne = data[0].max_tsne,
			min_tsne = data[0].min_tsne;
		const _self = this;        
		
		var svg = new ReactFauxDOM.Element('svg'),
			descriptor_size = Object.keys(bar_data).length,
			color_list = ['#ffff99', '#beaed4'],
			// color_list = ['#ffff99', '#fdc086', '#beaed4'],
			used_color = '',
			label_flag = false,
			reorder_item = false;
		// this.compare_N = color_list;

		let g; 
		this.pie = d3.pie().sort(null).value(function(d) { return 1; });
		this.circle_color = d3.scaleLinear().domain([0, 1]).range(['#bf5b17','#e31a1c']).interpolate(d3.interpolateHcl);
		this.circle_width = d3.scaleLinear().domain([0, 1]).range([1,2]);
		this.petals = data[0].dims;
		this.circle_position_x = d3.scaleLinear().domain([min_tsne[0],max_tsne[0]]).range([- 0,+ innerRadius]);
		this.circle_position_y = d3.scaleLinear().domain([min_tsne[1],max_tsne[1]]).range([- 0, + innerRadius]);
		var translate_x = 0;
		var translate_y = 0;
		svg.setAttribute('width', width);
		svg.setAttribute('height',height);
		svg.setAttribute('transform', 'translate(' + translate_x + ',' + translate_x + ')');


		// UPDATE THE LIST OF AVAILABLE COLORS TO PICK FOR CLICKING PATTERNS
		for(var i = 0; i < selectedPatterns.length; i++){
			used_color = d3.select('#pattern_' + selectedPatterns[i]).attr('stroke');   
			color_list.splice( color_list.indexOf(used_color), 1 );
		}

		// PLOT THE BACKDROP
		const backdrop = d3.select(svg)
						.append('g')
						.attr('class', 'background'),
					gFlowers = backdrop
						.append('g')
						.attr('transform', 'translate(' + ((width)/2-(innerRadius)/2) + ',' + ((height)/2-( innerRadius)/2) + ')') 					
						.attr('class', 'g_flowers');

		// ADD TOOLTIP
		const div_tooltip = d3.select('body').append('div')
						.attr('id', 'tooltip')
						.attr('class', 'tooltip')
						.style('opacity', 0);   

		backdrop.selectAll('path.line_pointer').remove();

		// ADD THE OUTER CIRCLES TO THE BACKDROP
		const circles = gFlowers.selectAll('.circle')
						.data(data)
						.enter().append('circle')
						.attr('class', 'outer_circle')
						.attr('r', gs.innerCircleRadius)
						.attr('fill', '#fc8d12')
						.attr('stroke-width', gs.innerCircleStrokeWidth)                
						.attr('fill-opacity', function(d) { return d.weight; })                         
						.attr('stroke-opacity', gs.innerCircleStrokeOpacity)
						.attr('id', (d) => 'pattern_' + d.id)                
						.attr('transform', (d, i) => { 
							return 'translate(' + _self.circle_position_x(d.tsne_coord.x) + ',' 
									+ _self.circle_position_y(d.tsne_coord.y) + ')'; 
							})
						.on('click', (d) => {
							if (d3.select('#pattern_' + d.id).classed('selected')) {
								_self.props.onUnClickPattern(d.id);
								let cancel_color = d3.select('#pattern_' + d.id).attr('stroke');
								d3.select('#pattern_' + d.id).classed('selected', false);                                       
								d3.select('#pattern_' + d.id).attr('stroke', 'none');
								for(let descriptor_index = 0; descriptor_index < descriptor_size; descriptor_index++){
									backdrop.select('path#link_'+descriptor_index).remove();
								}
								
							} else {
								if (selectedPatterns.length < this.compare_N) {
									let petals_path_items = d3.range(this.petals).map(function(p){
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

		// PLOT THE FLOWERS ==> PATTERNS
		const flowers = gFlowers.selectAll('.flower')
						.data(data)
						.enter().append('g')
						.attr('class', 'flower')
						.attr('id', (d) => 'flower_' + d.id)
						.attr('transform', (d, i) => { 
							return 'translate(' + _self.circle_position_x(d.tsne_coord.x) + ',' 
									+ _self.circle_position_y(d.tsne_coord.y) + ')'; 
						});

		// ADD THE PETALS TO FLOWERS ==> DESCRIPTORS                
		const petals = flowers.selectAll('.petal')
					.data((d) => this.pie(d.petals))
					.enter().append('path')
					.attr('class', 'petal')
					.attr('id', (d) => 'petal_'+d.data.id+'_' + d.index)
					.attr('transform', (d) => petal.rotateAngle((d.startAngle + d.endAngle) / 2))
					.attr('d', (d) => petal.petalPath(d, this.outerCircleRadius))
					.style('stroke', (d, i) => 'gray')
					.attr('stroke-width', function(d) {   
					})
					.attr('stroke', function(d) {   
					})
					.style('fill', (d, i) => petal.petalFill(d, i, this.petals))
					.style('fill-opacity', 0.8);

		// DRAW THE RADIAL BAR CHART
		for(let descriptor_index = 0; descriptor_index < descriptor_size; descriptor_index++){
			let pattern_cnt = selectedPatterns.length;
			// draw the bar for the default values that show the average of the patterns
			draw_bars_circular(bar_data, descriptor_index, max_pattern_item, [components_cnt], descriptor_size, this.layout.detailView.margin, width, height)

			// when selected more than one pattern, show the distribution of selected patterns.
			if(pattern_cnt > 0) {
				draw_bars_circular(bar_data, descriptor_index, max_pattern_item, selectedPatterns, descriptor_size, this.layout.detailView.margin, width, height);
				// only show the line pointer (dominating items) when one pattern is selected.
				if (pattern_cnt == 1) {
					draw_line_pointer(descriptor_index, arc_positions_bar_petal);
				}
			}	  
			reorder_item = (pattern_cnt == 2)? true : false;
			draw_query_circular(bar_data, descriptor_index, max_pattern_item, [components_cnt], descriptor_size, this.layout.detailView.margin, width, height, reorder_item = reorder_item);				

		}


		// Add the text of queried pattern rank
		if(query_flag){
			gFlowers.selectAll(".rankText")
					.data(similarPatternToQueries)
					.enter().append('text')
					.attr('transform', (d, i) => { 
						return 'translate(' + (_self.circle_position_x(d.tsne_coord.x)-5) + ',' 
								+ (_self.circle_position_y(d.tsne_coord.y)+5) + ')'; 
						})					
                	.text((d) => (d.rank+1).toString());
		}else{
			d3.select(".rankText").remove();
		}


		function draw_line_pointer(descriptor_index, arc_positions_bar_petal){
			let line = d3.line()
						.x(function (d) { return (d.x); })
						.y(function (d) { return (d.y); });

			let pattern_item_line = gFlowers.append('path')
					.attr('class', 'line_pointer')
					.attr('stroke', 'grey')
					.attr('stroke-width', 2)
					.attr('stroke-dasharray', '1,5')
					.attr('fill', 'none')		
					.attr('id', 'link_'+descriptor_index)					
					.attr('d', line(arc_positions_bar_petal[descriptor_index].coordinates));	
		}

		function draw_bars_circular(bar_data, descriptor_index, max_pattern_item, patternIndices, descriptor_size, margin, width, height){
			let patterns, items, items1;
			let descriptor_arcs;
			
			patterns = patternIndices.map((pattern_id) => bar_data[descriptor_index][pattern_id]);
			items = Object.keys(bar_data[descriptor_index][components_cnt]).filter((d) => d !== 'id').sort();
			if(patterns.length == 2){
				items1 = Object.keys(bar_data[descriptor_index][components_cnt+1]).filter((d) => d !== 'id').map(function(key){
					return [key, bar_data[descriptor_index][components_cnt+1][key]];
				}).sort(function(first, second) {
					return second[1] - first[1];
				});
				items = items1.map(function(key){return key[0]});				
			}


			// X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
			const x = d3.scaleBand()
							.range([2*Math.PI*(descriptor_index+1)/descriptor_size-0.2,  2*Math.PI*(descriptor_index+2)/descriptor_size-0.4])    
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
							.data(function(d,cur_index) {
								return items.map(function(key) { 
									return {key: key, value: d[key], id: d.id, index: cur_index};                         
								}); 
							})
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
					.attr('stroke', 'none')
					.attr('stroke-width', function(d) { 
						// bold the stroke for max_items for each descriptor
						if (typeof max_pattern_item[descriptor_index][d.id] != 'undefined') {
							if (d.key == max_pattern_item[descriptor_index][d.id]) {
								return '1px'; 
							} else {
								return '0px'; 
							}
						} else {
							return '0px';
						} 
					});

			// Add the labels     
			backdrop.selectAll("text.label_bar" + descriptor_index).remove();
			descriptor_arcs.append('g')
				.attr('class', 'descriptor_text' + descriptor_index)
				.attr('text-anchor', function(d) { return (x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length + Math.PI) % (2 * Math.PI) < Math.PI ? 'end' : 'start'; })
				.attr('transform', function(d) { return 'rotate(' + ((x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length) * 180 / Math.PI - 90) + ')'+'translate(' + (y(d.value)+20) + ',0)'; })
				.append('text')
				.text((d) => d.key)
				.attr('transform', function(d) { return (x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length + Math.PI) % (2 * Math.PI) < Math.PI ? 'rotate(180)' : 'rotate(0)'; })
				.style('font-size', '9px')
				.attr('id', (d) => 'label_' + descriptor_index + '_' + d.key)
				.attr('class', 'label_bar' + descriptor_index)
				.attr('alignment-baseline', 'middle')       
				.on('click', (d) => {
					let max_pattern_id = item_max_pattern[descriptor_index][d.key],
						link_max_pattern_item_data = {
							'd_flower': backdrop.select('path#petal_' + max_pattern_id + '_' + descriptor_index + '.petal').attr('d'),
							'translate_flower': backdrop.select('#flower_' + max_pattern_id).attr('transform'),
							'd_bar': backdrop.select('path#bar_' + descriptor_index + '_' + d.key).attr('d'),
							'item': d.key,
							'descriptor_index': descriptor_index,
							'pattern_id': d.id
						};
					backdrop.select('circle#pattern_'+max_pattern_id).attr('stroke', 'black');
					backdrop.select('circle#pattern_'+max_pattern_id).attr('stroke-opacity', '1');
			})
			
		}

		function draw_query_circular(bar_data, descriptor_index, max_pattern_item, patternIndices, descriptor_size, margin, width, height, reorder_item = false){
			let patterns, items, items1;
			let descriptor_arcs;
			let query_bar;
			
			patterns = patternIndices.map((pattern_id) => bar_data[descriptor_index][pattern_id]);
			items = Object.keys(bar_data[descriptor_index][components_cnt]).filter((d) => d !== 'id').sort();

			if(reorder_item){
				items1 = Object.keys(bar_data[descriptor_index][components_cnt+1]).filter((d) => d !== 'id').map(function(key){
					return [key, bar_data[descriptor_index][components_cnt+1][key]];
				}).sort(function(first, second) {
					return second[1] - first[1];
				});
				items = items1.map(function(key){return key[0]});				
			}	
			// X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
			const x = d3.scaleBand()
							.range([2*Math.PI*(descriptor_index+1)/descriptor_size-0.2,  2*Math.PI*(descriptor_index+2)/descriptor_size-0.4])    
							.domain(items) // The domain of the X axis is the list of states.
							.paddingInner(0.05),
						y = scaleRadial()
							.range([innerRadius-20, innerRadius])   // Domain will be define later.
							.domain([0, 3]), // Domain of Y is from 0 to the max seen in the data
						bar_opacity = d3.scaleLinear()
							.range([0, 1])
							.domain([0, d3.max(patterns, (d) =>
								d3.max(items, (key) => d[key])) ]
							);
						g = backdrop.append('g')
							.attr('class', 'queryView')
							.attr('id', 'query_'+descriptor_index+'_barchart')          
							.attr('transform', 'translate(' + (width / 2) + ',' + ( height/2 )+ ')'); 

			descriptor_arcs = g.selectAll('g')
							.select('#query' + descriptor_index)
							.data(patterns)
							.enter()                                    
							.selectAll('path')
							.data(function(d,cur_index) {
								return items.map(function(key) { 
									return {key: key, value: d[key], id: d.id, index: cur_index};                         
								}); 
							})
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
					.attr('class', (d) => 'query_' + descriptor_index)
					.attr('id', (d)=> 'query_bar_' + descriptor_index + '_' + d.key)
					.attr('fill', (d) => barFill(d, descriptor_index, descriptor_size, bar_opacity))
					.attr('opacity', 0.2)       
					.attr('stroke', 'none')
					.attr('stroke-width', '3px')
					.on('click', (d) => {
						let max_pattern_id = item_max_pattern[descriptor_index][d.key];
						let top_k = 5;
						if (d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).classed('queried')) {
							queries[descriptor_index].pop(d.key);
							_self.props.onClickItem(queries, top_k);							
							d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("stroke", "none");							
							d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).classed('queried', false);							
						} else {
							queries[descriptor_index].push(d.key);
							_self.props.onClickItem(queries, top_k);
							d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("stroke", "black");
							d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).classed('queried', true);
						}						
					})
					.on('mouseover', (d) => {
						Object.keys(item_similarity[descriptor_index][d.key]).map(function(key){										
							d3.select('#query_bar_' + descriptor_index+ '_'+ key).attr("opacity", item_similarity[descriptor_index][d.key][key]);
						});
					})
					.on('mouseout', (d) => {
						Object.keys(item_similarity[descriptor_index][d.key]).map(function(key){										
							d3.select('#query_bar_' + descriptor_index+ '_'+ key).attr("opacity", 0.1);
						});
					});									
		}		

		function axisStroke(i, descriptor_size) {
			return d3.hcl(i / descriptor_size * 360, 60, 70);
		};

		function barFill(d, descriptor_index, descriptor_size,bar_opacity) {
			if(d.id >= components_cnt){
				return axisStroke(descriptor_index, descriptor_size);
			} else {
				let cur_color  = d3.select('#pattern_' + d.id).attr('stroke'),       
						color_dark = d3.rgb(cur_color).darker(0.5),
						color_light = d3.rgb(cur_color).brighter(0.5),
						color_pick = d3.scaleLinear().domain([0, 1]).range([color_light,color_dark]);

				return color_pick(bar_opacity(d.value));
			}
		}
		function barFillOpacity(d, descriptor_index, descriptor_size, foregroundBarOpacity, backgroundBarOpacity,bar_opacity) {
			if (d.id >= components_cnt) {
				return 0.1;
			} else {
				return 1;
			}     
		};

		return (
			<div className={styles.CircularOverview}>
			<div className={index.title}>Circular View</div>      
				{svg.toReact()}
			</div>
		);
  }
}

export default CircularView;