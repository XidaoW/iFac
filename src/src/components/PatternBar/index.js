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


class PatternBar extends Component {
  
	constructor(props) {
		super(props);
		this.outerCircleRadius = parseInt(gs.outerCircleRadius);
		this.innerCircleRadius = parseInt(gs.innerCircleRadius);
		this.innerCircleStrokeWidth = parseInt(gs.innerCircleStrokeWidth);
		this.innerCircleStrokeOpacity = parseInt(gs.innerCircleStrokeOpacity);
		this.outerCircleStrokeWidth = parseInt(gs.outerCircleStrokeWidth);
		this.outerCircleStrokeOpacity = parseInt(gs.outerCircleStrokeOpacity);		
  }

  render() {

		const { idx, bar_data, components_cnt, itemEmbeddings } = this.props;
		const _self = this,
			barFillOpacityConst = 0.5;

		let	descriptor_size = Object.keys(bar_data).length,
			descriptor_size_list = Object.keys(bar_data).map((d) => Object.keys(bar_data[d][0]).length);

		const x_offset = 30,
			y_offset = 30,
			outerRadius = 50,
			innerRadius = 10;

		let g,
			svg = new ReactFauxDOM.Element('svg');
		svg.setAttribute('width', 50);
		svg.setAttribute('height',50);


		// DRAW THE RADIAL BAR CHART
		for(let descriptor_index = 0; descriptor_index < descriptor_size; descriptor_index++){
			draw_bars_circular(bar_data, descriptor_index, [idx], descriptor_size, descriptor_size_list);			
		}

		function draw_bars_circular(bar_data, descriptor_index, patternIndices, descriptor_size, descriptor_size_list){
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
			
			items = items.map((d, idx) => [d, itemEmbeddings['sc'][descriptor_index][idx][0]])
						.sort((first, second) => second[1] - first[1])
						.map((d) => d[0]);
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
						g = d3.select(svg).append('g')
							.attr('class', 'detailViewMini')
							.attr('id', 'descriptor_'+descriptor_index+'_barchart_mini')     
							.attr('transform', 'translate(' + x_offset + ',' +  x_offset + ')'); 

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
					.attr('opacity', (d) => barFillOpacity(d, descriptor_index, descriptor_size, _self.foregroundBarOpacity, _self.backgroundBarOpacity,bar_opacity))       
					.attr('fill', (d) => axisStroke(descriptor_index, descriptor_size))
					.attr('stroke', 'black')
					.attr('stroke-width', "0px");
		
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
			<span>					
				{svg.toReact()}
			</span>
		);
  }
}

export default PatternBar;