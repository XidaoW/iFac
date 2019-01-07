import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import { plot_linechart } from '../../lib/draw_linechart.js'

import _ from 'lodash';
import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)


class ControlView extends Component {
	constructor(props) {
		super(props);
		this.svg;
		this.svg_error;
		this.svg_stability;
		this.svg_interpretability;
		this.layout = {
			width: 120,
			height: 120,
		};		
	}

	render() {
		if (!this.props.error_data || this.props.error_data.length === 0)
			return <div />
		// adapted from https://bl.ocks.org/NGuernse/8dc8b9e96de6bedcb6ad2c5467f5ef9a
		const _self = this;
		const { components_cnt, descriptors_text, 
			error_data,  stability_data, interpretability_data} = this.props;

		var n = error_data.length, 
			title = '',
			margin = {top: 15, right: 15, bottom: 15, left: 15},
		  	width = this.layout.width - margin.left - margin.right, // Use the window's width 
		  	height = this.layout.height - margin.top - margin.bottom; // Use the window's height

		this.svg_error = new ReactFauxDOM.Element('svg');
		this.svg_stability = new ReactFauxDOM.Element('svg');
		this.svg_interpretability = new ReactFauxDOM.Element('svg');

		this.svg_error.setAttribute('width', width + margin.left + margin.right);
		this.svg_error.setAttribute('height', height + margin.top + margin.bottom);
		this.svg_stability.setAttribute('width', width + margin.left + margin.right);
		this.svg_stability.setAttribute('height', height + margin.top + margin.bottom);
		this.svg_interpretability.setAttribute('width', width + margin.left + margin.right);		
		this.svg_interpretability.setAttribute('height', height + margin.top + margin.bottom);
		this.svg_error.setAttribute('transform', "translate(" + margin.left + "," + margin.top + ")");
		this.svg_stability.setAttribute('transform', "translate(" + (margin.left + (width)*1) + "," + margin.top + ")");
		this.svg_interpretability.setAttribute('transform', "translate(" + (margin.left + (width)*2) + "," + margin.top + ")");		


		plot_linechart(this.svg_error, error_data, margin, width, height, n, title = "Reconstruction Error");
		plot_linechart(this.svg_stability, stability_data, margin, width, height, n, title = "Model Stability");
		plot_linechart(this.svg_interpretability, interpretability_data, margin, width, height, n, title = "Pattern interpretability");

		return (
			<div className={styles.infoPanel}>
				<div>#Patterns: {components_cnt}</div>
				<div>#Descriptors: {descriptors_text.join(', ')}</div>	
				{this.svg_error.toReact()}
				{this.svg_stability.toReact()}				
				{this.svg_interpretability.toReact()}				
			</div>
		);

	}
}

export default ControlView;
