import React, { Component } from 'react';
import * as d3 from 'd3';


import {AutoComplete, Tag, Input, Tooltip, Icon} from 'antd';

function onSelect(value) {
  console.log('onSelect', value);
}

class QueryPannel extends Component {

	constructor(props) {
		super(props);				
	}	
	state = {
		tags: [],
		inputVisible: false,
		inputValue: '',
		dataSource: []
	};

	handleClose = (removedTag) => {
		const tags = this.state.tags.filter(tag => tag !== removedTag);
		console.log(tags);
		this.setState({ tags });
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

	handleInputChange = (e) => {
		this.setState({ inputValue: e.target.value });
	}

	handleInputConfirm = () => {
		const state = this.state;
		const inputValue = state.inputValue;
		let tags = state.tags;
		if (inputValue && tags.indexOf(inputValue) === -1) {
			tags = [...tags, inputValue];
		}
		console.log(tags);
		this.setState({
			tags,
			inputVisible: false,
			inputValue: '',
		});
	}

	saveInputRef = input => this.input = input


  	renderNewTags() {
		const { descriptors, components_cnt,modes,queries } = this.props;
		const { tags, inputVisible, inputValue } = this.state;
		const dataSource = ['Burns Bay Road', 'Downing Street', 'Wall Street'];
					// onChange={this.handleInputChange}
					// onBlur={this.handleInputConfirm}
					// onPressEnter={this.handleInputConfirm}

		console.log(descriptors);

		return modes.map((mode, idx) => 
			(				
				<span>
				<Tag
					style={{ background: '#fff', borderStyle: 'dashed' }}
				>				
				<AutoComplete
					ref={this.saveInputRef}
					type="text"
					size="small"
					style={{ width: 78 }}
					dataSource={descriptors[mode]}
					onSelect={onSelect}
					onSearch={(e) => this.handleSearch(e)}					
					placeholder={mode}					
      				filterOption={(inputValue, option) => option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}					
				/>													
				</Tag>
				</span>

			));
  	}

	render() {
		const { tags, inputVisible, inputValue } = this.state;
		const { components_cnt,modes,queries } = this.props;  


		return (
			<div>
				{tags.map((tag, index) => {
					const isLongTag = tag.length > 20;
					const tagElem = (
						<Tag 
							key={tag} 
							closable={index !== 0} 
							afterClose={() => this.handleClose(tag)}>
							{isLongTag ? `${tag.slice(0, 20)}...` : tag}
						</Tag>
					);
					return isLongTag ? <Tooltip title={tag} key={tag}>{tagElem}</Tooltip> : tagElem;
				})}
				{this.renderNewTags()}
			</div>
		);
	}
}

export default QueryPannel;