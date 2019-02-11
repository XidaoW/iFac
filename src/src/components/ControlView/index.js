import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import { plot_linechart } from '../../lib/draw_linechart.js'
import _ from 'lodash';
import { Dropdown, DropdownItem, DropdownToggle, DropdownMenu } from 'reactstrap';
import { Tooltip, Slider, Icon, Collapse } from 'antd';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)
import 'antd/lib/slider/style'; // or antd/lib/button/style/css for css format file


class ControlView extends Component {
	constructor(props) {
		super(props);
		this.svg;
		this.svg_error;
		this.svg_stability;
		this.svg_interpretability;
		this.layout = {
			width: 130,
			height: 130,
		};		

		this.state = {
			datasetDropdownOpen: false
		}

		this.toggleDatasetDropdown = this.toggleDatasetDropdown.bind(this);
		this.handleClickDataset = this.handleClickDataset.bind(this);
		this.handleSetWeight = this.handleSetWeight.bind(this);		
	}

	toggleDatasetDropdown() {
		this.setState({
			datasetDropdownOpen: !this.state.datasetDropdownOpen
		});
	}

	handleClickDataset(e) {
		const selectedDataset = e.target.value;
		this.props.onChangeDataset(selectedDataset);
	}

    handleSetWeight(weight, idx) {
		this.props.onSetWeight(weight, idx);
    }


	renderDatasets() {
    const { datasets } = this.props;

    return datasets.map((dataset, idx) => 
        (<DropdownItem 
          key={idx}
          value={dataset}
          onClick={this.handleClickDataset}>
          {dataset}
        </DropdownItem>));
  }

	render() {
		if (!this.props.error_data || this.props.error_data.length === 0)
			return <div />
		// line charts adapted from https://bl.ocks.org/NGuernse/8dc8b9e96de6bedcb6ad2c5467f5ef9a
		// slider bar/ zoom drag https://bl.ocks.org/ngminhtrung/7c5721a1504f3e29a36da9ddd9e5039b
		const _self = this;
		const { components_cnt, descriptors_text, 
						error_data,  stability_data, fit_data, entropy_data, normalized_entropy_data,
						gini_data, theil_data, pctnonzeros_data, onClickPoint, domain,weights, metricPointSize } = this.props;


		var n = error_data.length, 
				title = '',
				labels = '',
				margin = {top: 15, right: 5, bottom: 25, left: 20},
				width = this.layout.width - margin.left - margin.right, // Use the window's width 
				height = this.layout.height - margin.top - margin.bottom; // Use the window's height
		this.svg_error = new ReactFauxDOM.Element('svg');
		this.svg_fit = new ReactFauxDOM.Element('svg');
		this.svg_stability = new ReactFauxDOM.Element('svg');
		this.svg_normalized_entropy = new ReactFauxDOM.Element('svg');
		this.svg_pctnonzeros = new ReactFauxDOM.Element('svg');

		this.svg_error.setAttribute('width', width + margin.left + margin.right);
		this.svg_error.setAttribute('height', height + margin.top + margin.bottom);
		this.svg_fit.setAttribute('width', width + margin.left + margin.right);		
		this.svg_fit.setAttribute('height', height + margin.top + margin.bottom);
		this.svg_stability.setAttribute('width', width + margin.left + margin.right);
		this.svg_stability.setAttribute('height', height + margin.top + margin.bottom);
		this.svg_normalized_entropy.setAttribute('width', width + margin.left + margin.right);		
		this.svg_normalized_entropy.setAttribute('height', height + margin.top + margin.bottom);
		this.svg_pctnonzeros.setAttribute('width', width + margin.left + margin.right);		
		this.svg_pctnonzeros.setAttribute('height', height + margin.top + margin.bottom);



		this.svg_error.setAttribute('transform', "translate(0," + margin.top + ")");
		this.svg_fit.setAttribute('transform', "translate(0," + margin.top + ")");		
		this.svg_stability.setAttribute('transform', "translate(0," + margin.top + ")");		
		this.svg_normalized_entropy.setAttribute('transform', "translate(0," + margin.top + ")");		
		this.svg_pctnonzeros.setAttribute('transform', "translate(0," + margin.top + ")");		

		
		var labels_a = ["good", "bad"],
			labels_b = ["bad", "good"];

		plot_linechart(onClickPoint, metricPointSize, this.svg_error, error_data, margin, width, height, n, title = "", labels = labels_a);
		plot_linechart(onClickPoint, metricPointSize, this.svg_fit, fit_data, margin, width, height, n, title = "", labels = labels_b);
		plot_linechart(onClickPoint, metricPointSize, this.svg_stability, stability_data, margin, width, height, n, title = "", labels = labels_b);		
		plot_linechart(onClickPoint, metricPointSize, this.svg_normalized_entropy, normalized_entropy_data, margin, width, height, n, title = "", labels = labels_a);
		plot_linechart(onClickPoint, metricPointSize, this.svg_pctnonzeros, pctnonzeros_data, margin, width, height, n, title = "", labels = labels_a);


		this.svg = new ReactFauxDOM.Element('svg')
		this.svg.setAttribute('width',  "100%");
		this.svg.setAttribute('height', 30);

		// add the red line legend
		d3.select(this.svg).append("text")
				.attr("x", 0)             
				.attr("y", 20)    
				.attr("class", "toggle")
				.style("fill", "red")         
				.on("click", function(){
					var newdisplay = "none";
					if (d3.selectAll(".toggle").classed('selected')) {
						newdisplay = "inline";
						d3.select(".toggle").classed('selected', false);                                       
					}else{
						newdisplay = "none";
						d3.select(".toggle").classed('selected', true);                                       
					}			
					d3.select("#scree_charts").style("display", newdisplay)		
				})
				.text("Model Inspection");



		return (
			<div className={styles.infoPanel}>
				<div className={styles.dataInspector}>
					<div className={index.title}>
						Dataset
						<Tooltip title="Dataset information. (You can switch to see results from different datasets)">
	    					<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
	  					</Tooltip>																	
					</div>
					<Dropdown className={styles.datasetDropdown}
										isOpen={this.state.datasetDropdownOpen} 
										toggle={this.toggleDatasetDropdown}>
						<DropdownToggle className={styles.datasetDropdownToggle} caret>
							{domain}
						</DropdownToggle>
						<DropdownMenu>
							{this.renderDatasets()}
						</DropdownMenu>
					</Dropdown>
					<div>#Patterns: {components_cnt}</div>
					<div>#Descriptors: {descriptors_text.join(', ')}</div>

				</div>
				<div className={styles.modelInspector}>
					<div class={index.title}>
						Model Inspection
						<Tooltip title="Inspect the quality of models under varying ranks from different pespectives. You can slide the weight for each metric to see a recommended rank being highlighted.">
	    					<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
	  					</Tooltip>											
					</div>
					<div className={styles.screeCharts}>
						<div className={styles.screeChart}>
							<div className={styles.screeChartName}>Reconstruction error</div>
							<div>
								<Slider 
									className={styles.metricSlider}
									step={0.2} 
									min={0}
									max={1}
									style={{ width: 100}}
									defaultValue={1} 
									onChange={(e) => this.handleSetWeight(e, 0)} 
								/>
							</div>
							{this.svg_error.toReact()}
						</div>
						<div className={styles.screeChart}>
							<div className={styles.screeChartName}>Model fit</div>
							<div>
								<Slider 
									className={styles.metricSlider}
									step={0.2} 
									min={0}
									max={1}
									style={{ width: 100}}
									defaultValue={1} 
									onChange={(e) => this.handleSetWeight(e, 1)} 
								/>
							</div>							
							{this.svg_fit.toReact()}
						</div>
						<div className={styles.screeChart}>
							<div className={styles.screeChartName}>Model stability</div>
							<div>
								<Slider 
									className={styles.metricSlider}
									step={0.2} 
									min={0}
									max={1}
									style={{ width: 100}}
									defaultValue={1} 
									onChange={(e) => this.handleSetWeight(e, 2)} 
								/>
							</div>							
							{this.svg_stability.toReact()}
						</div>
						<div className={styles.screeChart}>
							<div className={styles.screeChartName}>Normalized entropy</div>
							<div>
								<Slider 
									className={styles.metricSlider}
									step={0.2} 
									min={0}
									max={1}
									style={{ width: 100}}
									defaultValue={1} 
									onChange={(e) => this.handleSetWeight(e, 3)} 
								/>
							</div>							
							{this.svg_normalized_entropy.toReact()}
						</div>
						<div className={styles.screeChart}>
							<div className={styles.screeChartName}>Sparsity</div>
							<div>
								<Slider 
									className={styles.metricSlider}
									step={0.2} 
									min={0}
									max={1}
									style={{ width: 100}}
									defaultValue={1} 
									onChange={(e) => this.handleSetWeight(e, 4)} 
								/>
							</div>							
							{this.svg_pctnonzeros.toReact()}
						</div>
					</div>
				</div>				
			</div>
		);

	}
}

export default ControlView;
