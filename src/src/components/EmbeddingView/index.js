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

		const itemEmbeddingAll = require("../../data/" + "nbaplayer" + "/factors_"+"3"+"_"+ "20" + "_sample_item_embedding_all.json");
		console.log(itemEmbeddingAll);
		var itemEmbeddingAll_original = itemEmbeddingAll['mds'];
		var patternEmbedding_original = patternEmbeddings['mds'];
		var min_tsne = [d3.min(itemEmbeddingAll_original, (d) => d[0]), d3.min(itemEmbeddingAll_original, (d) => d[1])];
		var max_tsne = [d3.max(itemEmbeddingAll_original, (d) => d[0]), d3.max(itemEmbeddingAll_original, (d) => d[1])];
		var size_petal_radius = d3.scaleLinear().domain([0, 1]).range([1, this.outerCircleRadius]);
		var size_petal_arc = d3.scaleLinear().domain([0, 1]).range([0, 2 * Math.PI * this.outerCircleRadius/ descriptor_size]);

		const _self = this,
					width = +this.layout.svg.width,
					height = +this.layout.svg.height,
					outerRadius = Math.min(width, height) - 20,
					innerRadius = this.circularInnerRadius,
					barFillOpacityConst = 0.5, 
					query_flag = (Object.keys(queries).length == 0)? false: Object.keys(queries).map(function(key){			
						return queries[key].length;
					}).reduce((a,b)=>a+b);			

		console.log(descriptors);
		var all_items = [].concat(...Object.keys(descriptors).map((d) => descriptors[d]))
		console.log(all_items);
		// max_tsne = data[0].max_tsne,
		// min_tsne = data[0].min_tsne;

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

		let g,
			svg = new ReactFauxDOM.Element('svg');
		svg.setAttribute('width', width+200);
		svg.setAttribute('height',height+300);
		svg.setAttribute('transform', 'translate(' + translate_x + ',' + translate_y + ')');

		this.pie = d3.pie().sort(null).value((d) => 1);
		this.circle_color = d3.scaleLinear().domain([0, 1]).range(['#bf5b17','#e31a1c']).interpolate(d3.interpolateHcl);
		this.circle_width = d3.scaleLinear().domain([0, 1]).range([1,2]);
		this.circle_position_x = d3.scaleLinear().domain([min_tsne[0],max_tsne[0]]).range([- 0 + this.innerCircleRadius*2, + innerRadius - this.innerCircleRadius*2]);
		this.circle_position_y = d3.scaleLinear().domain([min_tsne[1],max_tsne[1]]).range([- 0 + this.innerCircleRadius*2, + innerRadius - this.innerCircleRadius*2]);

		// Update the list of available colors to pick for clicking patterns
		for(var i = 0; i < selectedPatterns.length; i++){
			used_color = d3.select('#pattern_' + selectedPatterns[i]).attr('stroke');   
			color_list.splice( color_list.indexOf(used_color), 1 );
		}

		data.forEach((d, i) => {			
				d.x = _self.circle_position_x(patternEmbedding_original[i][0]);
				d.y = _self.circle_position_y(patternEmbedding_original[i][1]);
				d.radius = parseInt(gs.innerCircleRadius);
			}
		);

		var item_data = d3.range(itemEmbeddingAll_original.length).map((d, i) => {		
			return {
				x: _self.circle_position_x(itemEmbeddingAll_original[d][0]),
				y: _self.circle_position_y(itemEmbeddingAll_original[d][1]),
				label: all_items[d],
				weight: 1,
				radius: 20
				}
			}
		);
		console.log(item_data);


		var simulation = d3.forceSimulation(item_data)
			.force("x", d3.forceX(function(d) { return d.x; }).strength(0.05))
			.force("y", d3.forceY(function(d) { return d.y; }).strength(0.05))
			.force("collide", d3.forceCollide().radius(function(d){ return 1.2*d.radius }))
			.force("manyBody", d3.forceManyBody().strength(-5))
			.stop();
  		for (var i = 0; i < 2000; ++i) simulation.tick();
			// .force("center", d3.forceCenter((width)/2-(innerRadius)/2, (height)/2-( innerRadius)/2))

		// draw the backdrop
		const backdrop = d3.select(svg)
						.append('g')
						.attr('class', 'background')
						.attr('transform', 'translate(100,100)'),
					gFlowers = backdrop
						.append('g')
						.attr('transform', 'translate(' + ((width)/2-(innerRadius)/2) + ',' + ((height)/2-( innerRadius)/2) + ')')
						.attr('class', 'g_flowers');

		// remove the lines between patterns and dominating items.
		// questionable functions
		backdrop.selectAll('path.line_pointer').remove();

		// Add the outer circles to the backdrop.
		const circles = gFlowers.selectAll('.pattern_circles')
						.data(item_data)
						.enter()
						.append('circle')
						.attr('class', 'pattern_circles')
						.attr('r', (d) => d.radius)
						.attr('fill', '#fc8d12')
						.attr('stroke', 'grey')
						.attr('stroke-width', gs.innerCircleStrokeWidth)                
						.attr('fill-opacity', (d) => d.weight) 
						.attr('stroke-opacity', 0.3)						
						.attr('id', (d) => 'pattern_' + d.label)                
						.attr('transform', (d, i) => 'translate(' + d.x + ',' 
									+ d.y + ')')
						.on("mouseover", function(d){
							tooltip.html('<div>pattern#' + d.label + '</div>'
								);
							tooltip.show();						
							
							// console.log(d3.select("tr[data-row-key='"+d.id+"']").position())

						})
						.on("mouseout", function(d){
							tooltip.hide();
						})									
						.on('click', (d) => {					
							
						})
						gFlowers.selectAll('.labeltext')
						.data(item_data)
						.enter()
						.append("text")
						.attr('class', 'labeltext')											
						.attr('transform', (d, i) => 'translate(' + d.x + ',' 
									+ d.y + ')')
						.text((d) => d.label)							
			

		function axisStroke(i, descriptor_size) {
			var color_list = ["#85D4E3", "#F4B5BD", "#9C964A", "#CDC08C", "#FAD77B"]
			return color_list[i];
			// return d3.hcl(i / descriptor_size * 360, 60, 70);
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
				{svg.toReact()}				
			</div>
		);
  }
}
export default EmbeddingView;