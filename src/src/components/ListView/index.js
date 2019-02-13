import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import d3tooltip from 'd3-tooltip';
import PatternGlyph from 'components/PatternGlyph';
import PatternBar from 'components/PatternBar';

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
			height: 1050,
			svg: {
				width: 200,
				height: 1050
			},
		};
  }

	renderPatternGlyphs() {
		const { data, bar_data, components_cnt, itemEmbeddings } = this.props;

		return data.map((d, idx) => 
			(				
				<span>
				<PatternGlyph 
					idx={idx} 
					data={data}  						
				/>
				<PatternBar 
					idx={idx} 
					components_cnt={components_cnt}
					itemEmbeddings={itemEmbeddings}
					bar_data={bar_data}
				/>				
				</span>
		));
  	}  	  	

	render() {
		const { clickedPattern } = this.props;
		console.log('circularView rendered');
		console.log('this.props.data: ', this.props.data);


		const { data, bar_data, selectedPatterns } = this.props;
		const _self = this,
					width = +this.layout.svg.width,
					height = +this.layout.svg.height;

		return (
			<div className={styles.ListView}>					
				<div className={index.title}>List View
					<Tooltip title="Pattern List">
    					<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
  					</Tooltip>				
				</div>	
				{this.renderPatternGlyphs()}		
			</div>
		);
  }
}

export default ListView;