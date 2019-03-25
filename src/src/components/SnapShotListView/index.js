import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import d3tooltip from 'd3-tooltip';
import ReactDOM from 'react-dom'
import SnapShot from 'components/SnapShot';
import PatternGlyph from 'components/PatternGlyph';
import QueryPanel from 'components/QueryPanel';
import TreeMapView from 'components/TreeMapView';

import {scaleRadial} from '../../lib/draw_radial.js';

import * as quadPath from '../../lib/draw_quadratic_path.js';
import * as petal from '../../lib/draw_petals.js';

import _ from 'lodash';
import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)
import Circos, { SCATTER } from 'react-circos';
import { Tooltip, ButtonGroup, Button, Icon, Table, Divider, Tag, List, Avatar } from 'antd';
import scrollIntoView from 'scroll-into-view';

const tooltip = d3tooltip(d3);


class SnapShotListView extends Component {
  
	constructor(props) {
		super(props);
		this.layout = {
			width: 450,
			height: 400,
			svg: {
				width: 450,
				height: 400
			},
		};
		this.selector = React.createRef();	
		this.color_list_petal = props.color_list_petal;	
		this.handleOnClick = this.handleOnClick.bind(this);						
		this.handleOnMouseEnter = this.handleOnMouseEnter.bind(this);						
		this.handleOnMouseLeave = this.handleOnMouseLeave.bind(this);						
		this.renderTags = this.renderTags.bind(this);	
		this.handleDeleteQuery = this.handleDeleteQuery.bind(this);	
		this.handleLoadQuery = this.handleLoadQuery.bind(this);	
		this.handleResetItems = this.handleResetItems.bind(this);				

	}


	handleResetItems() {
		d3.selectAll('.query_bar').classed('queried', false)	
		d3.selectAll('.query_bar').attr("stroke", "none");
		d3.selectAll('.itemTags').remove()
		this.props.onResetItems();		
	}


	handleDeleteQuery(Query){
		this.props.onDeleteQuery(Query);
	}

	handleLoadQuery(Query){
		this.props.onLoadQuery(Query);
	}



	handleOnClick(rowIndex){
		// const node = ReactDOM.findDOMNode(d3.select("Table").node());
		// node.scrollTop = node.scrollHeight;
		// var svg = d3.select('circle#pattern_mini_' + rowIndex);

		// console.log(rowIndex);
		// console.log(d3.select('circle#pattern_' + rowIndex));
	}	

	handleOnMouseEnter(rowIndex){
		// if (!d3.select('#pattern_' + rowIndex).empty() && !d3.select('#pattern_' + rowIndex).classed('selected')){
		// 	d3.select('#pattern_' + rowIndex).attr('stroke-opacity', 1); 
		// 	d3.select('#pattern_mini_' + rowIndex).attr('stroke-opacity', 1); 
		// }					
	}
	handleOnMouseLeave(rowIndex){
		// if (!d3.select('#pattern_' + rowIndex).empty() && !d3.select('#pattern_' + rowIndex).classed('selected')){
		// 	d3.select('#pattern_' + rowIndex).attr('stroke-opacity', 0.3); 
		// 	d3.select('#pattern_mini_' + rowIndex).attr('stroke-opacity', 0.3); 
		// }
	}

	renderTags(tags){
		const color_list = this.color_list_petal;
		if(Object.keys(tags).length > 0){
	  		return Object.keys(tags).map((mode, idx) => {
				if((mode in tags) && tags[mode].length > 0){	  						
				return tags[mode].map((tag, index) => {						
					const isLongTag = tag.length > 20;
					const tagElem = (
						<span>
							<Tag
								className={"itemTags"}
								color={color_list[mode]}
								key={tag}>
								{isLongTag ? `${tag.slice(0, 20)}...` : tag}
							</Tag>
						</span>
					);				
					return isLongTag ? <Tooltip title={tag} key={tag}>{tagElem}</Tooltip> : tagElem;
				})
				}
			});
		}	
	}

	render() {

		const ButtonGroup = Button.Group;

		console.log('listView rendered');
		const { data, bar_data, similarPatternToQueries, 
			components_cnt, descriptors, queries, patternEmbeddings,
			query_list,modes,selectedPatterns,
			display_projection } = this.props;
		const color_list = this.color_list_petal;			
		const _self = this,
					width = +this.layout.svg.width,
					height = +this.layout.svg.height;
		// var query_list_ = [{0:['2','3'], 1:['JohnWall'], 2: ['BasketArea']}, {0:['2','3'], 1:['JohnWall'], 2: ['BasketArea']}];
		// var query_list_ = [[['2','3'],['JohnWall']],[['2'],['BasketArea']]];
		console.log(query_list);
		var query_list_ = query_list;
		const columns = [{
			  title: 'Query',
			  key: 'Query',
			  dataIndex: 'Query',
			  render: Query => (
			  <span>
					{Object.keys(Query).map(mode => {
						var tags = Query[mode];
						return tags.map(tag => {

							let isLongTag = tag.length > 20;
							if(isLongTag){
								return <Tooltip title={tag} key={tag}>
									<Tag
										color={color_list[mode]}
										key={tag}>
										{tag.slice(0, 20) + '...'}
									</Tag>
								</Tooltip>
							}else{
								return <Tag
										color={color_list[mode]}
										key={tag}>
										{tag}
									</Tag>

							}
						})
					})}
			  	</span>
			  ),
			}, {
			  title: 'Action',
			  dataIndex: 'Query',
			  key: 'Action',
			  render: Query => (
			    <span>
					<ButtonGroup>
					      <Button size="small" onClick={(event) => {this.handleLoadQuery(Query)}} shape="circle" icon="read" />
					      <Button size="small" onClick={(event) => {this.handleDeleteQuery(Query)}} shape="circle" icon="close" />
					</ButtonGroup>			    
			    </span>
			  ),		  
			}];

		const data_ = query_list.map((query, i) => {
			console.log(query);
			return {
						key: i, 
						ID:i,
						Query:query,
						Snapshot:query,
					}
		})
		return (
				<div className={styles.DetailView}>
					<div className={index.title}>
						Multi-Faceted Pattern Query
						<Tooltip title="Input item">
							<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
						</Tooltip>																							
					</div>	
					<div className={styles.queryPanel} >			
						<QueryPanel
							onQueryItem={this.props.onClickItem}
							onResetItem={this.handleResetItems}
							color_list_petal={this.props.color_list_petal}
							descriptors={descriptors}
							components_cnt={components_cnt}
							modes={modes}
							onSaveQuery={this.props.onSaveQuery}
							queries={this.props.queries}
						/>	
					</div>				
					<div className={styles.queryList} id="table" ref={this.selector}>	
						<Table					
							onRow={(record, rowIndex) => {
								return {
									onClick: (event) => {this.handleLoadQuery(record.Query)},
								};
							}}
							rowClassName={(record, rowIndex) => 'query_row_' + record.ID}
							columns={columns} 
							size={"small"}
							scroll={{ y: 200 }}
							showHeader={false}
							pagination={false} 
							dataSource={data_} 
							locale={{emptyText:<Tooltip title="Save your query for a quick retrieval">Query Book</Tooltip>}}
						/>
					</div>
					<div className={index.title}>
						Content
						<Tooltip title="Pattern narrative as word clouds">
							<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
						</Tooltip>																							
					</div>
					<div className={styles.treeMap} >			
						<TreeMapView
							bar_data={bar_data}		
							data={data}		
							selectedPatterns={selectedPatterns}
							components_cnt={components_cnt}
							descriptors={descriptors}
							modes={modes}
							queries={queries}
							color_list_petal={color_list}
							onClickItem={this.handleClickItem}
							onResetPatterns={this.handleResetPatterns}
							onResetItems={this.handleResetItems}					
						/>			
					</div>
				</div>
		);
  }
}

export default SnapShotListView;