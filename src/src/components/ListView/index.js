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
import { Table, Divider, Tag } from 'antd';


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
		this.handleOnClick = this.handleOnClick.bind(this);						
		this.handleOnMouseEnter = this.handleOnMouseEnter.bind(this);						
		this.handleOnMouseLeave = this.handleOnMouseLeave.bind(this);						
	}

	handleOnClick(rowIndex){
		console.log(rowIndex);
		console.log(d3.select('circle#pattern_' + rowIndex));
	}

	handleOnMouseEnter(rowIndex){
		if (!d3.select('#pattern_' + rowIndex).classed('selected')){
			d3.select('circle#pattern_' + rowIndex).attr("stroke", "black");
			d3.select('circle#pattern_mini_' + rowIndex).attr("stroke", "black"); 									
		}					
	}
	handleOnMouseLeave(rowIndex){
		if (!d3.select('#pattern_' + rowIndex).classed('selected')){
			d3.select('circle#pattern_' + rowIndex).attr("stroke", "none"); 
			d3.select('circle#pattern_mini_' + rowIndex).attr("stroke", "none"); 									
		}
	}

	render() {
		console.log('listView rendered');
		console.log('this.props.data: ', this.props.data);
		const { data, bar_data, components_cnt, itemEmbeddings, clickedPatternIdx } = this.props;
		const _self = this,
					width = +this.layout.svg.width,
					height = +this.layout.svg.height;
		console.log(clickedPatternIdx);
		const columns = [{
			title: 'ID',
			dataIndex: 'ID',
			key: 'ID',
			render: (text, row, index) => {
				return {
					children: <span>{text}</span>,
					props: {
						width: 3,
						align: 'left',
						padding: 3,
					},
				};
			}		  
			}, {
			  title: 'Glyph',
			  dataIndex: 'Glyph',
			  key: 'Glyph',
			  render: Glyph => (
			    <span>
					<PatternGlyph 
							idx={Glyph} 
							data={data}
						/>
			    </span>
			  ),		  
			}, {
			  title: 'Snapshot',
			  key: 'Snapshot',
			  dataIndex: 'Snapshot',
			  render: Snapshot => (
			    <span>
					<PatternBar 
						idx={Snapshot} 
						components_cnt={components_cnt}
						itemEmbeddings={itemEmbeddings}
						bar_data={bar_data}
					/>				
			    </span>
			  ),
			}];


		const data_ = d3.range(data.length).map((d) => {
			return {
						key: d, 
						ID:d,
						Glyph:d,
						Snapshot:d,
					}
		})
		return (
			<div className={styles.ListView}>					
				<div className={index.title}>List View
					<Tooltip title="Pattern List">
    					<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
  					</Tooltip>				
				</div>	
				<Table 
					onRow={(record, rowIndex) => {
						return {
							onClick: (event) => {this.handleOnClick(rowIndex)},
							onMouseEnter: (event) => {this.handleOnMouseEnter(rowIndex)},
							onMouseLeave: (event) => {this.handleOnMouseLeave(rowIndex)},
						};
					}}
					rowClassName={(record, rowIndex) => 'row' + rowIndex}
					columns={columns} 
					size={"small"}
					scroll={{ y: 800 }}
					pagination={false} 
					dataSource={data_} 
				/>

			</div>
		);
  }
}

export default ListView;