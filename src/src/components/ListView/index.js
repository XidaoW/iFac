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


class ListView extends Component {
  
	constructor(props) {
		super(props);
		this.layout = {
			width: 200,
			height: 850,
			svg: {
				width: 200,
				height: 950
			},
		};
  }

  render() {

  		return null;
		console.log('circularView rendered');
		console.log('this.props.data: ', this.props.data);


		const { data, bar_data, selectedPatterns } = this.props;
		const _self = this,
					width = +this.layout.svg.width,
					height = +this.layout.svg.height;

		let g,
			svg = new ReactFauxDOM.Element('svg');

		svg.setAttribute('width', width);
		svg.setAttribute('height',height);
		svg.setAttribute('transform', 'translate(' + 0 + ',' + 0 + ')');
		// console.log(data);

		g = d3.select(svg).append("g")					
				.attr("width", "100%")
				.attr("height", "100%")
				.attr("transform", "translate(" + 5 + "," + 10 + ")");
		g.append("text").text("hello")
		// const backdrop = d3.select(svg)
		// 				.append('g')
		// 				.attr('class', 'background')
		// 				.attr('transform', 'translate(0,10)');
		var ul = g.append('ul');


  var names = ['Frank', 'Tom', 'Peter', 'Mary'];

		var li = ul.selectAll('li')
			.data(names)
			.enter()
			.append('li').html(String);
		// li.append('circle')
		// 	.attr('class', 'circle')
		// 	.attr('r', 10)
		// 	.attr('fill', '#fc8d12')
		// 	.attr('stroke-width', 2)                
		// 	.attr('fill-opacity', (d) => d.weight) 
		// 	.attr('stroke-opacity', 0.8)
		// 	.attr('id', (d) => 'pattern_' + d.id)
    // // create a cell in each row for each column
    // 	var cells = rows.selectAll("td")
	   //      .data(function(d) {
	   //      	console.log(d)
    //     })
    //     .enter()
    //     .append("td")


		// // Add the outer circles to the backdrop.
		// const circles = gFlowers.selectAll('.circle')
		// 				.data(data)
		// 				.enter()
		// 				.append('circle')
		// 				.attr('class', 'outer_circle')
		// 				.attr('r', gs.innerCircleRadius)
		// 				.attr('fill', '#fc8d12')
		// 				.attr('stroke-width', gs.innerCircleStrokeWidth)                
		// 				.attr('fill-opacity', (d) => d.weight) 
		// 				.attr('stroke-opacity', gs.innerCircleStrokeOpacity)
		// 				.attr('id', (d) => 'pattern_' + d.id)                
		// 				.attr('transform', (d, i) => 'translate(' + _self.circle_position_x(d.tsne_coord.x) + ',' 
		// 							+ _self.circle_position_y(d.tsne_coord.y) + ')')
		// 				.on("mouseover", function(d){
		// 					tooltip.html('<div>pattern#' + d.id + '</div>'+ 
		// 						'<div>dominance: ' + d3.format(".0%")(d.weight) + '</div>');
		// 					tooltip.show();
		// 				})
		// 				.on("mouseout", function(d){
		// 					tooltip.hide();
		// 				})									
		// 				.on('click', (d) => {
		// 					if (d3.select('#pattern_' + d.id).classed('selected')) {
		// 						_self.props.onUnClickPattern(d.id);
		// 						let cancel_color = d3.select('#pattern_' + d.id).attr('stroke');
		// 						d3.select('#pattern_' + d.id).classed('selected', false);                                       
		// 						d3.select('#pattern_' + d.id).attr('stroke', 'none');
		// 						// remove the lines between patterns and the dominating items.
		// 						for(let descriptor_index = 0; descriptor_index < descriptor_size; descriptor_index++){
		// 							backdrop.select('path#link_'+descriptor_index).remove();
		// 						}								
		// 					} else {
		// 						if (selectedPatterns.length < this.compare_N) {
		// 							let petals_path_items = d3.range(descriptor_size).map(function(p){
		// 								return {
		// 									'd_flower': backdrop.select('path#petal_'+d.id+'_'+p+'.petal').attr('d'),
		// 									'transform_petal': backdrop.select('path#petal_'+d.id+'_'+p+'.petal').attr('transform'),
		// 									'translate_flower': backdrop.select('#flower_'+d.id).attr('transform'),
		// 									'transform_bar': backdrop.select('g#descriptor_'+p+'_barchart').attr('transform'),
		// 									'transform_g_flower': backdrop.select('g.g_flowers').attr('transform'),
		// 									'd_bar': backdrop.select('path#bar_'+p+'_'+max_pattern_item[p][d.id]).attr('d'),
		// 									'item': max_pattern_item[p][d.id],
		// 									'descriptor_index': p,
		// 									'pattern_id': d.id
		// 								}
		// 							});
		// 							_self.props.onClickPattern(d.id, petals_path_items);
		// 							d3.select('#pattern_' + d.id).classed('selected', true);							
		// 							d3.select('#pattern_' + d.id).attr('stroke', color_list[0]);    							
		// 							color_list.splice(0, 1);
		// 						}
		// 					}
		// 				});

		// // plot the flowers
		// const flowers = gFlowers.selectAll('.flower')
		// 				.data(data)
		// 				.enter()
		// 				.append('g')
		// 				.attr('class', 'flower')
		// 				.attr('id', (d) => 'flower_' + d.id)
		// 				.attr('transform', (d, i) => 'translate(' + _self.circle_position_x(d.tsne_coord.x) + ',' 
		// 							+ _self.circle_position_y(d.tsne_coord.y) + ')');
		// // add the petals to the flowers
		// const petals = flowers.selectAll('.petal')
		// 			.data((d) => this.pie(d.petals))
		// 			.enter()
		// 			.append('path')
		// 			.attr('class', 'petal')
		// 			.attr('id', (d) => 'petal_'+d.data.id+'_' + d.index)
		// 			.attr('transform', (d) => petal.rotateAngle((d.startAngle + d.endAngle) / 2))
		// 			.attr('d', (d) => petal.petalPath(d, this.outerCircleRadius))
		// 			.style('stroke', (d, i) => 'gray')
		// 			.attr('stroke-width', function(d) {   
		// 			})
		// 			.attr('stroke', function(d) {   
		// 			})
		// 			.on("mouseover", function(d, i){
		// 				tooltip.html('<div>descriptor#' + d.data.id +"(" + i + ")" + '</div>'+ 
		// 					'<div>informativeness: ' + d3.format(".0%")(d.data.length) + '</div>' +
		// 					'<div>similarity: ' + d3.format(".0%")(d.data.width) + '</div>');
		// 				tooltip.show();
		// 			})
		// 			.on("mouseout", function(d){
		// 				tooltip.hide();
		// 			})
		// 			.style('fill', (d, i) => petal.petalFill(d, i, descriptor_size))
		// 			.style('fill-opacity', 0.6);


		return (
			<div className={styles.ListView}>					
				<div className={index.title}>List View
					<Tooltip title="Pattern List">
    					<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
  					</Tooltip>					
				</div>
			</div>
		);
  }
}

export default ListView;