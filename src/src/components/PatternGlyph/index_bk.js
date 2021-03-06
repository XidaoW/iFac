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
		this.outerCircleRadius = parseInt(gs.outerCircleRadius);
		this.innerCircleRadius = parseInt(gs.innerCircleRadius);
		this.innerCircleStrokeWidth = parseInt(gs.innerCircleStrokeWidth);
		this.innerCircleStrokeOpacity = parseInt(gs.innerCircleStrokeOpacity);
		this.outerCircleStrokeWidth = parseInt(gs.outerCircleStrokeWidth);
		this.outerCircleStrokeOpacity = parseInt(gs.outerCircleStrokeOpacity);		
  }

  render() {

		const { data, idx } = this.props;
		const _self = this,
				descriptor_size = data[0].dims;
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
						.attr('r', width/2-2)
						.attr('fill', '#fc8d12')
						.attr('stroke-width', gs.innerCircleStrokeWidth)                
						.attr('fill-opacity', (d) => d.weight) 
						.attr('stroke-opacity', gs.innerCircleStrokeOpacity)
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
		// add the petals to the flowers
		const petals = flowers.selectAll('.petal_mini')
					.data((d) => this.pie(d.petals))
					.enter()
					.append('path')
					.attr('class', 'petal_mini')
					.attr('id', (d) => 'petal_mini_'+d.data.id+'_' + d.index)
					.attr('transform', (d) => petal.rotateAngle((d.startAngle + d.endAngle) / 2))
					.attr('d', (d) => petal.petalPath(d, width/4))
					.style('stroke', (d, i) => 'gray')
					.style('fill', (d, i) => petal.petalFill(d, i, descriptor_size))
					.style('fill-opacity', 0.6);

		return (
			<span>					
				{svg.toReact()}
			</span>
		);
  }
}

export default PatternGlyph;