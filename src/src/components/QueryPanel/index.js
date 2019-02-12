import React, { Component } from 'react';
import * as d3 from 'd3';


import {AutoComplete, Tag, Input, Tooltip, Icon} from 'antd';

function onSelect(value) {
  console.log('onSelect', value);
}

class QueryPanel extends Component {

	constructor(props) {
		super(props);			
	}	
	state = {
		tags: this.props.queries,
		inputVisible: false,
		inputValue: '',
		dataSource: []
	};

	handleClose = (removedTag, idx) => {
		var tags = this.state.tags;

		d3.select('#query_bar_' + idx+ '_'+ removedTag).attr("stroke", "none");
		d3.select('#query_bar_' + idx+ '_'+ removedTag).classed('queried', false);

		if(Object.keys(tags).length == 0){
			tags = {}			
		}else{
			tags[idx] = tags[idx].filter(tag => tag !== removedTag);	
			this.props.onQueryItem(tags, 5);	
		}
		this.setState({ tags:  tags});	
		
	}

	showInput = () => {
		this.setState({ inputVisible: true }, () => this.input.focus());
	}

	handleSearch = (value) => {
		this.setState({
			dataSource: !value ? [] : [
				value,
				value + value,
				value + value + value,
			],
		});
	}

	handleOnSelect = (idx, value) => {
		const state = this.state;
		let tags = state.tags;
		let inputValue = value;
		d3.select('#query_bar_' + idx+ '_'+ value).attr("stroke", "black");
		d3.select('#query_bar_' + idx+ '_'+ value).classed('queried', true);

		if(!(idx in tags)){
			tags[idx] = []
		}

		if (value && tags[idx].indexOf(inputValue) === -1) {
			tags[idx] = [...tags[idx], inputValue];
		}
		this.setState({
			tags,
			inputValue: '',
		});				
		this.props.onQueryItem(tags, 5);		
	}
	handleInputChange = (e) => {
		this.setState({ inputValue: e.target.value });
	}

	saveInputRef = input => this.input = input


  	renderExistingTags(){
		const { onQueryItem, descriptors, components_cnt,modes,queries } = this.props;
		const { tags, inputVisible, inputValue } = this.state;
		const color_list = ["#85D4E3", "#F4B5BD", "#9C964A", "#CDC08C", "#FAD77B"]
		if(Object.keys(tags).length > 0){
	  		return Object.keys(tags).map((mode, idx) => {
	  					console.log(tags[idx]);
	  					if((idx in tags) && tags[idx].length > 0){	  						
							return tags[idx].map((tag, index) => {						
								const isLongTag = tag.length > 20;
								const tagElem = (
									<Tag
										color={color_list[idx]}
										key={tag} 
										closable={true}
										afterClose={() => this.handleClose(tag, idx)}>
										{isLongTag ? `${tag.slice(0, 20)}...` : tag}
									</Tag>
								);
								return isLongTag ? <Tooltip title={tag} key={tag}>{tagElem}</Tooltip> : tagElem;
							})
	  					}
					});
		}
  	}

  	renderNewTags() {
		const { descriptors, components_cnt,modes,queries } = this.props;
		const { tags, inputVisible, inputValue } = this.state;

		return modes.map((mode, idx) => 
			(				
				<span>
				<Tag
					style={{ background: '#fff', borderStyle: 'dashed' }}
				>
				<Icon type='plus'/>				
				<AutoComplete
					ref={this.saveInputRef}
					type="text"
					size="small"
					style={{ width: 200 }}
					dataSource={descriptors[mode]}					
					onSelect={(e) => this.handleOnSelect(idx, e)}					
					onSearch={(e) => this.handleSearch(e)}					
					placeholder={mode}					
      				filterOption={(inputValue, option) => option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}					
				/>													
				</Tag>
				</span>

			));
  	}



	render() {
		return (
			<div>
				{this.renderExistingTags()}
				{this.renderNewTags()}
			</div>
		);
	}
}

export default QueryPanel;