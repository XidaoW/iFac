import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import d3tooltip from 'd3-tooltip';
import {scaleRadial} from '../../lib/draw_radial.js';
import * as quadPath from '../../lib/draw_quadratic_path.js';
import * as petal from '../../lib/draw_petals.js';
import PatternGlyph from 'components/PatternGlyph';

import _ from 'lodash';
import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)
import Circos, { SCATTER } from 'react-circos';
import { Spin, Switch, message, Modal, Tag, Input, Tooltip, Icon, Button, Radio } from 'antd';
import QueryPanel from 'components/QueryPanel';
import scrollIntoView from 'scroll-into-view';

const tooltip = d3tooltip(d3);


class SnapShot extends Component {
  
	constructor(props) {
		super(props);
		this.layout = {
			svg: {
				width: 45,
				height: 45
			},
			detailView: {
				margin: {
					top: gs.detailViewMarginTop,
					bottom: gs.detailViewMarginBottom,
					left: gs.detailViewMarginLeft,
					right: gs.detailViewMarginRight
				}
			},
		};

		this.pie;	
		this.circle_position_x;
		this.circle_position_y;
		this.svg;
		this.circle_color;
		this.circle_width;
		this.query_flag;
		this.compare_N = 2;
		this.color_list_petal = props.color_list_petal;
		this.outerCircleRadius = 1.2;
		this.innerCircleRadius = 2.5;
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
		console.log('circularView rendered');
		const { data, selectedPatterns,
				bar_data,modes,
				queries, similarPatternToQueries, descriptors,
				components_cnt,
				display_projection,
				patternEmbeddings } = this.props;  

		let	descriptor_size = Object.keys(bar_data).length,
			descriptor_size_list = Object.keys(bar_data).map((d) => Object.keys(bar_data[d][0]).length),
			color_list = ['#FFD700', '#beaed4'],
			used_color = '',
			shift_size = 0.1,
			label_flag = false,
			reorder_item = false,
			translate_x = 0,
			translate_y = 0,
			draw_label = true,
			top_k = 5;


		var patternEmbedding_original = patternEmbeddings['mds'];
		var min_tsne = [d3.min(patternEmbedding_original, (d) => d[0]), d3.min(patternEmbedding_original, (d) => d[1])];
		var max_tsne = [d3.max(patternEmbedding_original, (d) => d[0]), d3.max(patternEmbedding_original, (d) => d[1])];
		var petal_Radius = this.outerCircleRadius * Math.sin(360 / (descriptor_size*2) * (Math.PI / 180)) + 0.5;
		var size_petal_radius = d3.scaleLinear().domain([0, 1]).range([1, petal_Radius]);
		var size_petal_arc = d3.scaleLinear().domain([0, 1]).range([0, 2 * Math.PI * this.outerCircleRadius/ descriptor_size]);



		const _self = this,
					width = +this.layout.svg.width,
					height = +this.layout.svg.height,
					outerRadius = Math.min(width, height) - 2,
					innerRadius = 25,
					barFillOpacityConst = 0.5, 
					query_flag = (Object.keys(queries).length == 0)? false: Object.keys(queries).map(function(key){			
						return queries[key].length;
					}).reduce((a,b)=>a+b);			

		this.query_flag = query_flag;
		let g,
			svg = new ReactFauxDOM.Element('svg');
		svg.setAttribute('width', width+20);
		svg.setAttribute('height',height+30);
		svg.setAttribute('transform', 'translate(' + translate_x + ',' + translate_y + ')');

		this.pie = d3.pie().sort(null).value((d) => 1);
		this.circle_color = d3.scaleLinear().domain([0, 1]).range(['#bf5b17','#e31a1c']).interpolate(d3.interpolateHcl);
		this.circle_width = d3.scaleLinear().domain([0, 1]).range([1,2]);
		this.circle_position_x = d3.scaleLinear().domain([min_tsne[0],max_tsne[0]]).range([+ 5 - this.innerCircleRadius*2, + innerRadius + this.innerCircleRadius*2]);
		this.circle_position_y = d3.scaleLinear().domain([min_tsne[1],max_tsne[1]]).range([+ 5 - this.innerCircleRadius*2, + innerRadius + this.innerCircleRadius*2]);


		data.forEach((d, i) => {			
				d.x = _self.circle_position_x(patternEmbedding_original[i][0]);
				d.y = _self.circle_position_y(patternEmbedding_original[i][1]);
				d.radius = parseInt(gs.innerCircleRadius);
			}
		);

		var simulation = d3.forceSimulation(data)
			.force("x", d3.forceX(function(d) { return d.x; }).strength(0.1))
			.force("y", d3.forceY(function(d) { return d.y; }).strength(0.1))
			.force("collide", d3.forceCollide().radius(function(d){ return 0.8*d.radius }))
			.force("manyBody", d3.forceManyBody().strength(-1))
			.stop();
  		for (var i = 0; i < 2000; ++i) simulation.tick();

		// draw the backdrop
		const backdrop = d3.select(svg)
						.append('g')
						.attr('class', 'background')
						.attr('transform', 'translate(10,10)'),
					gFlowers = backdrop
						.append('g')
						.attr('transform', 'translate(' + ((width)/2-(innerRadius)/2) + ',' + ((height)/2-( innerRadius)/2) + ')')
						.attr('class', 'g_flowers');

		drawPatterns();	
		draw_query_result(similarPatternToQueries, query_flag);
		
		function drawPatterns(){

			d3.selectAll('.detailView').attr("opacity", 1);
			d3.selectAll('.queryView').attr("opacity", 1);					

			// Add the outer circles to the backdrop.
			const circles = gFlowers.selectAll('.pattern_circles')
							.data(data)
							.enter()
							.append('circle')
							.attr('class', 'pattern_circles')
							.attr('r', (d) => d.radius/10)
							.attr('fill', '#fc8d12')
							.attr('stroke', 'grey')
							.attr('stroke-width', gs.innerCircleStrokeWidth)                
							.attr('fill-opacity', (d) => d.weight) 
							.attr('stroke-opacity', 0.3)						
							.attr('id', (d) => 'pattern_' + d.id)                
							.attr('transform', (d, i) => 'translate(' + d.x + ',' 
										+ d.y + ')')
							.on("mouseover", function(d){
								var curPattern = similarPatternToQueries.filter((sps) => sps.pattern_idx == d.id)
								if(curPattern.length > 0){
									var tooltipHtml = '<div>pattern#' + d.id + '</div>'+ 
									'<div>' +
									"Relevance:" + d3.format(".0%")(curPattern[0].relevance_score)
									+ '</div>';
								}else{
									var tooltipHtml = '<div>pattern#' + d.id + '</div>'+ 
									'<div>' +
									"Dominance:" + d3.format(".0%")(d.weight)
									+ '</div>';
								}
								tooltip.html(tooltipHtml);
								tooltip.show();						
								if (!d3.select('#pattern_' + d.id).classed('selected')){
									d3.select('#pattern_' + d.id).attr('stroke-opacity', 1); 
									d3.select('#pattern_mini_' + d.id).attr('stroke-opacity', 1); 
								}							
							})
							.on("mouseout", function(d){
								tooltip.hide();
								if (!d3.select('#pattern_' + d.id).classed('selected')){
									d3.select('#pattern_' + d.id).attr('stroke-opacity', 0.3);
									d3.select('#pattern_mini_' + d.id).attr('stroke-opacity', 0.3);
								}						
							})									
							.on('click', (d) => {
							
								if (d3.select('#pattern_' + d.id).classed('selected')) {
									_self.props.onUnClickPattern(d.id);
									let cancel_color = d3.select('#pattern_' + d.id).attr('stroke');
									d3.select('#pattern_' + d.id).classed('selected', false); 
									d3.select('#pattern_' + d.id).attr('stroke', 'grey');                                      
									d3.select('#pattern_' + d.id).attr('stroke-opacity', 0.3);
									d3.select('#pattern_mini_' + d.id).attr('stroke', 'grey');
									d3.select('#pattern_mini_' + d.id).attr('stroke-opacity', 0.3);
									
								} else {
									if (selectedPatterns.length < _self.compare_N) {

										let petals_path_items = [];
										_self.props.onClickPattern(d.id, petals_path_items);
										d3.select('#pattern_' + d.id).classed('selected', true);							
										d3.select('#pattern_' + d.id).attr('stroke', color_list[0]);  
										d3.select('#pattern_mini_' + d.id).attr("stroke", color_list[0]); 
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
							.attr('transform', (d, i) => 'translate(' +d.x + ',' 
										+ d.y + ')')
							.style("display", "inline");

			
			// bubbles
			var use_bubbles = false,
				use_petal = false;
			if(use_bubbles){
				const petals = flowers.selectAll('.petal')
							.data((d) => _self.pie(d.petals))
							.enter()
							.append('circle')
							.attr('class', 'petal')
							.attr('id', (d) => 'petal_'+d.data.id+'_' + d.index)
							.on("mouseover", function(d, i){
								tooltip.html('<div>descriptor#' + d.data.id +"(" + i + ")" + '</div>'+ 
									'<div>informativeness: ' + d3.format(".0%")(d.data.length) + '</div>' +
									'<div>similarity: ' + d3.format(".0%")(d.data.width) + '</div>');
								tooltip.show();
							})
							.on("mouseout", function(d){
								tooltip.hide();
							})
							.attr('transform', (d) => {var coords = petal.polarToCartesian(d.endAngle, _self.outerCircleRadius); return 'translate(' +coords.x + ',' 
											+ coords.y + ')';})
							.attr('r', (d) => size_petal_radius(d.data.length))
							.style('stroke', (d, i) => 'gray')
							.style('fill', (d, i) => axisStroke(i, descriptor_size))
							.style('fill-opacity', (d) => d.data.width);				
			}else if(use_petal){
				const petals = flowers.selectAll('.petal')
						.data((d) => _self.pie(d.petals))
						.enter()
						.append('path')
						.attr('class', 'petal')
						.attr('id', (d) => 'petal_'+d.data.id+'_' + d.index)
						.attr('transform', (d) => petal.rotateAngle((d.startAngle + d.endAngle) / 2))
						.attr('d', (d) => petal.petalPath(d, _self.outerCircleRadius))
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
						.style('fill', (d, i) => axisStroke(i, descriptor_size))
						.style('fill-opacity', (d) => d.data.width);						
			}else{
				// var min_width = d3.min(data, (d) => {console.log(d); return d.data.width});
				// var max_width = d3.max(data, (d) => d.data.width);

				// var color_threshold = d3.scaleQuantize()
				// 	.domain([0, 1]).range([0, 1]);
				var color_threshold = d3.scaleLinear()
					.domain([0, 1]).range([0, 1]);

				// width => similarity
				// height => informativeness
				const petals = flowers.selectAll('.petal')
							.data((d) => _self.pie(d.petals))
							.enter()
							.append('ellipse')
							.attr('class', 'petal')
							.attr('id', (d) => 'petal_'+d.data.id+'_' + d.index)
							.on("mouseover", function(d, i){
								tooltip.html('<div>descriptor#' + d.data.id +"(" + i + ")" + '</div>'+ 
									'<div>informativeness: ' + d3.format(".0%")(d.data.length) + '</div>' +
									'<div>similarity: ' + d3.format(".0%")(d.data.width) + '</div>');
								tooltip.show();
							})
							.on("mouseout", function(d){
								tooltip.hide();
							})						
							.attr('transform', (d) => petal.rotateTransform((d.startAngle + d.endAngle) / 2 , _self.outerCircleRadius))						
							.attr('rx', (d) => size_petal_radius(1))
							.attr('ry', (d) => size_petal_radius(d.data.length))						
							.style('stroke', (d, i) => 'gray')
							.style("display", "inline")
							.style('fill', (d, i) => axisStroke(i, descriptor_size))
							.style('fill-opacity', (d) => color_threshold(d.data.width));
			}
			// https://bl.ocks.org/puzzler10/49f13307e818ea9a909ba5adba5b6ed9		

		}
		
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
				var min_relevance = d3.min(similarPatternToQueries, (d) => d.relevance_score);
				var max_relevance = d3.max(similarPatternToQueries, (d) => d.relevance_score);
				var fill_scale = d3.scaleLinear().domain([min_relevance, max_relevance]).range([0, 1]);
				for(let similarIndex = 0; similarIndex < similarPatternToQueries.length; similarIndex++){
					// similarPatternToQueries[similarIndex]
					gFlowers.select(".pattern_circles#pattern_" + similarPatternToQueries[similarIndex].pattern_idx)
							.attr('fill-opacity', fill_scale(similarPatternToQueries[similarIndex].relevance_score));
					d3.select(".pattern_circles_mini#pattern_mini_" + similarPatternToQueries[similarIndex].pattern_idx)
							.attr('fill-opacity', fill_scale(similarPatternToQueries[similarIndex].relevance_score));

				}

			}else{
				for(let similarIndex = 0; similarIndex < similarPatternToQueries.length; similarIndex++){
					// similarPatternToQueries[similarIndex]
					gFlowers.select(".pattern_circles#pattern_" + similarPatternToQueries[similarIndex].pattern_idx)
							.attr('fill-opacity', similarPatternToQueries[similarIndex].dominance);
					d3.select(".pattern_circles_mini#pattern_mini_" + similarPatternToQueries[similarIndex].pattern_idx)
							.attr('fill-opacity', similarPatternToQueries[similarIndex].dominance);

				}
			}

		}



		function axisStroke(i, descriptor_size) {
			// var _self.color_list_petal = ["#85D4E3", "#F4B5BD", "#9C964A", "#CDC08C", "#FAD77B"];
			return _self.color_list_petal[i];
			// return d3.hcl(i / descriptor_size * 360, 60, 70);
		};

		function computeDescriptorRange(descriptor_index, descriptor_size,descriptor_size_list, shift_size){
			/**
			 * Compute the start angle and end angle for descriptor
			 * 2 solutions 
			 * a.1) compute the total size of a descriptor divided by descriptor count
			 * a.2) obtain the maximum size of descriptor
			 * a.3) compute each item size by dividing 1) by 2)
			 * 
			 * b.1) compute the unit size by dividing total item cnt
			 * b.2) obtain the maximum size of descriptor
			 * b.3) compute each item size by dividing 1) by 2)
			 *
			 * @since      0.0.0
			 *
			 *
			 * @param {array}   similarPatternToQueries           a ranked list of similarity between pattern and query.
			 * @param {boolean}  query_flag     if there is query input.
			 * 
			 */		

			// solution a
			var total_size = 2*Math.PI/descriptor_size,
				max_item_cnt = d3.max(descriptor_size_list),
				each_value = total_size*1. / max_item_cnt,
				total_value_current = each_value * descriptor_size_list[descriptor_index],
				start_value = 2*Math.PI*(descriptor_index+1)/descriptor_size + shift_size + (total_size - total_value_current) / 2.0,
				end_value = 2*Math.PI*(descriptor_index+2)/descriptor_size - (total_size - total_value_current) / 2.0;

			// solution b
			// let new_array = [];			
			// descriptor_size_list.reduce( (prev, curr,i) =>  new_array[i] = prev + curr , 0 );
			// new_array = [0].concat(new_array);
			// new_array = new_array.concat(new_array);
			// var total_item_size = _.sum(descriptor_size_list),
			// 	start_value,
			// 	end_value,
			// 	start_value = (2*Math.PI*new_array[descriptor_index])/total_item_size,
			// 	end_value = (2*Math.PI*new_array[descriptor_index+1])/total_item_size;
			return [start_value,  end_value];	
		}  

		function barFill(d, descriptor_index, descriptor_size, bar_opacity) {
			if(d.id >= components_cnt){
				return axisStroke(descriptor_index, descriptor_size);
			}
			return d3.select('#pattern_' + d.id).attr('stroke');
			// return color_pick(bar_opacity(d.value));
		}
		function barFillOpacity(d, descriptor_index, descriptor_size, foregroundBarOpacity, backgroundBarOpacity,bar_opacity) {
			return (d.id >= components_cnt)? barFillOpacityConst : 1;
		};

		return (
			<span>
				{svg.toReact()}
			</span>
		);
  }
}
export default SnapShot;