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
import { Tooltip, Icon } from 'antd';
import { List, Avatar } from 'antd';


const tooltip = d3tooltip(d3);


class PatternGlyph extends Component {
  
	constructor(props) {
		super(props);
		this.pie;
		this.compare_N = 2;
		this.miniPatternSize = 30,
		this.color_list_petal = props.color_list_petal;
		this.outerCircleRadius = parseInt(gs.outerCircleRadius);
		this.innerCircleRadius = parseInt(gs.innerCircleRadius);
		this.innerCircleStrokeWidth = parseInt(gs.innerCircleStrokeWidth);
		this.innerCircleStrokeOpacity = parseInt(gs.innerCircleStrokeOpacity);
		this.outerCircleStrokeWidth = parseInt(gs.outerCircleStrokeWidth);
		this.outerCircleStrokeOpacity = parseInt(gs.outerCircleStrokeOpacity);		
  }

  render() {

		const { data, idx, similarPatternToQueries } = this.props;
		console.log(similarPatternToQueries);
		const _self = this,
				descriptor_size = data[idx].petals.length;
		let g,
			svg = new ReactFauxDOM.Element('svg'),
			patternSize = this.miniPatternSize,
			width = patternSize,
			height = patternSize			

		svg.setAttribute('width', width);
		svg.setAttribute('height',width);

		this.pie = d3.pie().sort(null).value((d) => 1);
		const x_offset = width/2,
			y_offset = height/2;
		// Add the outer circles to the backdrop.
		const circles = d3.select(svg).selectAll('.pattern_circles_mini')
						.data([data[idx]])
						.enter()
						.append('circle')
						.attr('class', 'pattern_circles_mini')
						.attr('r', width/2-1)
						.attr('fill', '#fc8d12')
						.attr('stroke', 'grey')
						.attr('stroke-width', gs.innerCircleStrokeWidth)                
						.attr('fill-opacity', (d, i) => {
							return (similarPatternToQueries && similarPatternToQueries.length > 0)? similarPatternToQueries[i].relevance_score: d.weight;
						}) 
						.attr('stroke-opacity', 0.3)
						.attr('id', (d) => 'pattern_mini_' + d.id)                
						.attr('transform', (d, i) => 'translate(' + x_offset + ',' 
									+ x_offset + ')');
		// plot the flowers
		const flowers = d3.select(svg).selectAll('.flower_mini')
						.data([data[idx]])
						.enter()
						.append('g')
						.attr('class', 'flower_mini')
						.attr('id', (d) => 'flower_mini_' + d.id)
						.attr('transform', (d, i) => 'translate(' +x_offset + ',' 
									+ x_offset + ')');

		var petal_Radius = width/4 * Math.sin(360 / (descriptor_size*2) * (Math.PI / 180));
		var size_petal_radius = d3.scaleLinear().domain([0, 1]).range([1, petal_Radius]);
		var size_petal_arc = d3.scaleLinear().domain([0, 1]).range([0, 2 * Math.PI * width/ descriptor_size]);
		// add the petals to the flowers

		// bubbles
		var use_bubbles = false,
			use_petal = false;
		if(use_bubbles){
			const petals = flowers.selectAll('.petal')
						.data((d) => this.pie(d.petals))
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
						.attr('transform', (d) => {var coords = petal.polarToCartesian(d.endAngle, size_petal_arc(1),this.outerCircleRadius, descriptor_size); return 'translate(' +coords.x + ',' 
										+ coords.y + ')';})
						.attr('r', (d) => size_petal_radius(d.data.length))
						.style('stroke', (d, i) => 'gray')
						.style('fill', (d, i) => petalFill(d, i, descriptor_size))
						.style('fill-opacity', (d) => d.data.width);				
		}else if(use_petal){
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
					.style('fill', (d, i) => petalFill(d, i, descriptor_size))
					.style('fill-opacity', (d) => d.data.width);						
		}else{
			// var min_width = d3.min(data, (d) => {console.log(d); return d.data.width});
			// var max_width = d3.max(data, (d) => d.data.width);

			var color_threshold = d3.scaleQuantize()
				.domain([0, 1]).range([0, 1]);

			// width => similarity
			// height => informativeness
			const petals = flowers.selectAll('.petal')
						.data((d) => this.pie(d.petals))
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
						.attr('transform', (d) => petal.rotateTransform((d.startAngle + d.endAngle) / 2 , this.outerCircleRadius))						
						.attr('rx', (d) => size_petal_radius(1))
						.attr('ry', (d) => size_petal_radius(d.data.length))						
						.style('stroke', (d, i) => 'gray')
						.style('fill', (d, i) => petalFill(i, descriptor_size))
						.style('fill-opacity', (d) => color_threshold(d.data.width));
		}
				

		function petalFill(i, descriptor_size) {
			// var _self.color_list_petal = ["#85D4E3", "#F4B5BD", "#9C964A", "#CDC08C", "#FAD77B"];
			return _self.color_list_petal[i];
			// return d3.hcl(i / descriptor_size * 360, 60, 70);
		};

		return (
			<span>					
				{svg.toReact()}
			</span>
		);
  }
}

export default PatternGlyph;