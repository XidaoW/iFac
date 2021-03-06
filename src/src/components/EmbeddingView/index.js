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
import QueryPanel from 'components/QueryPanel';
import scrollIntoView from 'scroll-into-view';

const tooltip = d3tooltip(d3);

class EmbeddingView extends Component {
  
	constructor(props) {
		super(props);
		this.layout = {
			svg: {
				width: 450,
				height: 450
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
		this.handleDeletePattern = this.handleDeletePattern.bind(this);						
		this.handleMergePattern = this.handleMergePattern.bind(this);						
	}

	handleResetPatterns() {
		d3.selectAll('.pattern_circles').attr('stroke-opacity', 0.3);
		d3.selectAll('.pattern_mini_circles').attr('stroke-opacity', 0.3);
		// d3.selectAll('.pattern_circles').attr('stroke', 'none');
		this.props.onResetPatterns();
	}
	handleResetItems() {
		d3.selectAll('.query_bar').classed('queried', false)	
		d3.selectAll('.query_bar').attr("stroke", "none");
		d3.selectAll('.itemTags').remove()
		this.props.onResetItems();		
	}

	handleDeletePattern() {
		d3.selectAll('.query_bar').classed('queried', false)	
		d3.selectAll('.query_bar').attr("stroke", "none");
		d3.selectAll('.itemTags').remove()
		this.props.onDeletePattern();
	}

	handleMergePattern() {
		d3.selectAll('.query_bar').classed('queried', false)	
		d3.selectAll('.query_bar').attr("stroke", "none");
		d3.selectAll('.itemTags').remove()
		this.props.onMergePattern();
	}

	render() {
		console.log('circularView rendered');
		console.log('this.props.data: ', this.props.data);
		const { data, selectedPatterns,
				mostSimilarPatternToSelectedPatternIdx,
				leastSimilarPatternToSelectedPatternIdx, 
				arc_positions_bar_petal,item_max_pattern,
				bar_data, max_pattern_item,modes,
				queries, similarPatternToQueries, item_links, descriptors,
				mouseOveredDescriptorIdx, item_similarity, components_cnt,
				itemEmbeddings,patternEmbeddings } = this.props;  

		const ButtonGroup = Button.Group;
		let g,
			svg = new ReactFauxDOM.Element('svg');


		const _self = this,
					width = +this.layout.svg.width,
					height = +this.layout.svg.height,
					outerRadius = Math.min(width, height) - 20,
					innerRadius = this.circularInnerRadius,
					barFillOpacityConst = 0.5, 
					query_flag = (Object.keys(queries).length == 0)? false: Object.keys(queries).map(function(key){			
						return queries[key].length;
					}).reduce((a,b)=>a+b);					
  // var margin = {top: 20, right: 20, bottom: 30, left: 40},
  //   width = 960 - margin.left - margin.right,
  //   height = 500 - margin.top - margin.bottom;

		svg.setAttribute('width', width+200);
		svg.setAttribute('height',height+300);
		// svg.setAttribute('transform', 'translate(' + translate_x + ',' + translate_y + ')');

		const itemEmbeddingAll = require("../../data/" + "nbaplayer" + "/factors_"+"3"+"_"+ "20" + "_sample_item_embedding_2.json");
		console.log(itemEmbeddingAll);
		var itemEmbeddingAll_original = itemEmbeddingAll['mds'][1];
		console.log(itemEmbeddingAll_original);

		var min_tsne = [d3.min(itemEmbeddingAll_original, (d) => d[0]), d3.min(itemEmbeddingAll_original, (d) => d[1])];
		var max_tsne = [d3.max(itemEmbeddingAll_original, (d) => d[0]), d3.max(itemEmbeddingAll_original, (d) => d[1])];
		var size_petal_radius = d3.scaleLinear().domain([0, 1]).range([1, this.outerCircleRadius]);
		var size_petal_arc = d3.scaleLinear().domain([0, 1]).range([0, 2 * Math.PI * this.outerCircleRadius/ descriptor_size]);

		let	descriptor_size = Object.keys(bar_data).length,
			descriptor_size_list = Object.keys(bar_data).map((d) => Object.keys(bar_data[d][0]).length),
			color_list = ['#ffff99', '#beaed4'],
			used_color = '',
			shift_size = 0.1,
			label_flag = false,
			reorder_item = false,
			translate_x = 0,
			translate_y = 0,
			top_k = 5;

		var all_items = [].concat(...Object.keys(descriptors).map((d) => descriptors[d]))

		// max_tsne = data[0].max_tsne,
		// min_tsne = data[0].min_tsne;

		// Define the sizes and margins for our canvas.

		// Cast my values as numbers and determine ranges.
		var minmax = {p1: {min:0, max:0}, p2: {min:0, max:0}}
		itemEmbeddingAll_original.forEach(function(d) {
			d.p1 = +d[0];
			d.p2 = +d[1];
			minmax.p1.min = Math.min(d.p1, minmax.p1.min);
			minmax.p1.max = Math.max(d.p1, minmax.p1.max);
			minmax.p2.min = Math.min(d.p2, minmax.p2.min);
			minmax.p2.max = Math.max(d.p2, minmax.p2.max);
		});
		g = d3.select(svg)
						.append('g')
						.attr('class', 'background')
						.attr('transform', 'translate(100,100)');


		// Set-up my x scale.
		var x = d3.scaleLinear()
			.range([0, width])
			.domain([Math.floor(minmax.p1.min), Math.ceil(minmax.p1.max)]);

		// Set-up my y scale.
		var y = d3.scaleLinear()
			.range([height, 0])
			.domain([Math.floor(minmax.p2.min), Math.ceil(minmax.p2.max)]);

		// console.log(descriptors[Object.keys(descriptors)[2]]);
		var item_data = d3.range(itemEmbeddingAll_original.length).map((d, i) => {		
			return {
				x: x(itemEmbeddingAll_original[d][0]),
				y: y(itemEmbeddingAll_original[d][1]),
				label: descriptors[Object.keys(descriptors)[1]][d],
				weight: 1,
				radius: 20
				}
			}
		);


  // Create my x-axis using my scale.
  var xAxis = d3.axisBottom()
				.scale(x);

var yAxis = d3.axisLeft()
				.scale(y)


  // Set-up my colours/groups.
  // var color = d3.scaleOrdinal(d3.schemeCategory10);
  // var groups = {};
  // groupData.forEach(function(d) {
  //   groups[d.line] = d.group;
  // });

  


  // // Draw my x-axis.
  // g.append("g")
  //   .attr("class", "x axis")
  //   .attr("transform", "translate(0," + y(0) + ")")
  //   .call(xAxis)
  // .append("text")
  //   .attr("class", "label")
  //   .attr("x", width)
  //   .attr("y", -6)
  //   .style("text-anchor", "end")
  //   .text("Coord. 1");

  // // Draw my y-axis.
  // g.append("g")
  //   .attr("class", "y axis")
  //   .attr("transform", "translate(" + x(0) + ",0)")
  //   .call(yAxis)
  // .append("text")
  //   .attr("class", "label")
  //   .attr("transform", "rotate(-90)")
  //   .attr("y", 6)
  //   .attr("dy", ".71em")
  //   .style("text-anchor", "end")
  //   .text("Coord. 2");

  // Create all the data points :-D.
  g.selectAll(".dot")
    .data(itemEmbeddingAll_original)
  .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 3.5)
    .attr("cx", function(d) { return x(d.p1); })
    .attr("cy", function(d) { return y(d.p2); })
	.on("mouseover", function(d){
		tooltip.html('<div>item#' + d.label + '</div>'
			);
		tooltip.show();						
		
		// console.log(d3.select("tr[data-row-key='"+d.id+"']").position())

	})
	.on("mouseout", function(d){
		tooltip.hide();
	});

	g.selectAll('.labeltext')
	.data(item_data)
	.enter()
	.append("text")
	.attr('class', 'labeltext')											
	.attr('transform', (d, i) => 'translate(' + d.x + ',' 
	+ d.y + ')')
	.text((d) => d.label)							

//     .style("stroke", function(d) { return color(groups[d.name]); })
//     .style("fill", function(d) { return color(groups[d.name]); });

  
//   // Create the container for the legend if it doesn't already exist.
//   var legend = g.selectAll(".legend")
//     .data(color.domain())
//   .enter().append("g")
//     .attr("class", "legend")
//     .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

//   // Draw the coloured rectangles for the legend.
//   legend.append("rect")
//     .attr("x", width - 18)
//     .attr("width", 18)
//     .attr("height", 18)
//     .style("fill", color);

//   // Draw the labels for the legend.
//   legend.append("text")
//     .attr("x", width - 24)
//     .attr("y", 9)
//     .attr("dy", ".35em")
//     .style("text-anchor", "end")
//     .text(function(d) { return d; });


	





		// this.pie = d3.pie().sort(null).value((d) => 1);
		// this.circle_color = d3.scaleLinear().domain([0, 1]).range(['#bf5b17','#e31a1c']).interpolate(d3.interpolateHcl);
		// this.circle_width = d3.scaleLinear().domain([0, 1]).range([1,2]);
		// this.circle_position_x = d3.scaleLinear().domain([min_tsne[0],max_tsne[0]]).range([- 0 + this.innerCircleRadius*2, + innerRadius - this.innerCircleRadius*2]);
		// this.circle_position_y = d3.scaleLinear().domain([min_tsne[1],max_tsne[1]]).range([- 0 + this.innerCircleRadius*2, + innerRadius - this.innerCircleRadius*2]);

		// // Update the list of available colors to pick for clicking patterns
		// for(var i = 0; i < selectedPatterns.length; i++){
		// 	used_color = d3.select('#pattern_' + selectedPatterns[i]).attr('stroke');   
		// 	color_list.splice( color_list.indexOf(used_color), 1 );
		// }


		// var simulation = d3.forceSimulation(item_data)
		// 	.force("x", d3.forceX(function(d) { return d.x; }).strength(0.05))
		// 	.force("y", d3.forceY(function(d) { return d.y; }).strength(0.05))
		// 	.force("collide", d3.forceCollide().radius(function(d){ return 1.2*d.radius }))
		// 	.force("manyBody", d3.forceManyBody().strength(-5))
		// 	.stop();
		// for (var i = 0; i < 2000; ++i) simulation.tick();
		// 	// .force("center", d3.forceCenter((width)/2-(innerRadius)/2, (height)/2-( innerRadius)/2))

		// // draw the backdrop
		// const backdrop = d3.select(svg)
		// 				.append('g')
		// 				.attr('class', 'background')
		// 				.attr('transform', 'translate(100,100)'),
		// 			gFlowers = backdrop
		// 				.append('g')
		// 				.attr('transform', 'translate(' + ((width)/2-(innerRadius)/2) + ',' + ((height)/2-( innerRadius)/2) + ')')
		// 				.attr('class', 'g_flowers');

		// // remove the lines between patterns and dominating items.
		// // questionable functions
		// backdrop.selectAll('path.line_pointer').remove();

		// // Add the outer circles to the backdrop.
		// const circles = gFlowers.selectAll('.pattern_circles')
		// 				.data(item_data)
		// 				.enter()
		// 				.append('circle')
		// 				.attr('class', 'pattern_circles')
		// 				.attr('r', (d) => d.radius)
		// 				.attr('fill', '#fc8d12')
		// 				.attr('stroke', 'grey')
		// 				.attr('stroke-width', gs.innerCircleStrokeWidth)                
		// 				.attr('fill-opacity', (d) => d.weight) 
		// 				.attr('stroke-opacity', 0.3)						
		// 				.attr('id', (d) => 'pattern_' + d.label)                
		// 				.attr('transform', (d, i) => 'translate(' + d.x + ',' 
		// 							+ d.y + ')')
		// 				.on("mouseover", function(d){
		// 					tooltip.html('<div>item#' + d.label + '</div>'
		// 						);
		// 					tooltip.show();						
							
		// 					// console.log(d3.select("tr[data-row-key='"+d.id+"']").position())

		// 				})
		// 				.on("mouseout", function(d){
		// 					tooltip.hide();
		// 				})									
		// 				.on('click', (d) => {					
							
		// 				})
		// 				gFlowers.selectAll('.labeltext')
		// 				.data(item_data)
		// 				.enter()
		// 				.append("text")
		// 				.attr('class', 'labeltext')											
		// 				.attr('transform', (d, i) => 'translate(' + d.x + ',' 
		// 							+ d.y + ')')
		// 				.text((d) => d.label)							
			

		// function axisStroke(i, descriptor_size) {
		// 	var color_list = ["#85D4E3", "#F4B5BD", "#9C964A", "#CDC08C", "#FAD77B"]
		// 	return color_list[i];
		// 	// return d3.hcl(i / descriptor_size * 360, 60, 70);
		// };



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
					<Button onClick={this.handleDeletePattern}>
						Delete Pattern
					</Button>				
					<Button onClick={this.handleMergePattern}>
						Merge Pattern
					</Button>									
					</ButtonGroup>
					{svg.toReact()}
			</div>
		);
  }
}
export default EmbeddingView;