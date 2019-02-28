import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import d3tooltip from 'd3-tooltip';
import ReactDOM from 'react-dom'
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
import { Tooltip, Icon, Table, Divider, Tag, List, Avatar } from 'antd';
import scrollIntoView from 'scroll-into-view';

const tooltip = d3tooltip(d3);


class ListView extends Component {
  
	constructor(props) {
		super(props);
		this.layout = {
			width: 200,
			height: 1000,
			svg: {
				width: 200,
				height: 1000
			},
		};
		this.selector = React.createRef();		
		this.handleOnClick = this.handleOnClick.bind(this);						
		this.handleOnMouseEnter = this.handleOnMouseEnter.bind(this);						
		this.handleOnMouseLeave = this.handleOnMouseLeave.bind(this);						
	}

	handleOnClick(rowIndex){
		// const node = ReactDOM.findDOMNode(d3.select("Table").node());
		// node.scrollTop = node.scrollHeight;
		// var svg = d3.select('circle#pattern_mini_' + rowIndex);

		// console.log(rowIndex);
		// console.log(d3.select('circle#pattern_' + rowIndex));
	}	

	handleOnMouseEnter(rowIndex){
		if (!d3.select('#pattern_' + rowIndex).classed('selected')){
			d3.select('#pattern_' + rowIndex).attr('stroke-opacity', 1); 
			d3.select('#pattern_mini_' + rowIndex).attr('stroke-opacity', 1); 
		}					
	}
	handleOnMouseLeave(rowIndex){
		if (!d3.select('#pattern_' + rowIndex).classed('selected')){
			d3.select('#pattern_' + rowIndex).attr('stroke-opacity', 0.3); 
			d3.select('#pattern_mini_' + rowIndex).attr('stroke-opacity', 0.3); 
		}
	}

	render() {
		console.log('listView rendered');
		const { data, bar_data, similarPatternToQueries, components_cnt, itemEmbeddings, clickedPatternIdx } = this.props;
		const _self = this,
					width = +this.layout.svg.width,
					height = +this.layout.svg.height;

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

		if(similarPatternToQueries.length > 0){
			var patternIndices = similarPatternToQueries.sort((first, second) => 
				first[2] - second[2]
			).map((d) => d.pattern_idx);
		}else{
			var patternIndices = d3.range(data.length).map((d) => d);
		}
		const data_ = patternIndices.map((d) => {
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
				<div id="table" ref={this.selector}>	
				<Table					
					onRow={(record, rowIndex) => {
						return {
							onClick: (event) => {this.handleOnClick(record.ID)},
							onMouseEnter: (event) => {this.handleOnMouseEnter(record.ID)},
							onMouseLeave: (event) => {this.handleOnMouseLeave(record.ID)},
						};
					}}
					rowClassName={(record, rowIndex) => 'pattern_row_' + record.ID}
					columns={columns} 
					size={"small"}
					scroll={{ y: 650 }}
					pagination={false} 
					dataSource={data_} 
				/>
				</div>

			</div>
		);
  }
}

export default ListView;