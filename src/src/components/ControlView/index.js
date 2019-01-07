import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import * as petal from '../../lib/draw_petals.js'

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
			width: 150,
			height: 150,
			svg: {
				width: 250, // 90% of whole layout
				height: 150 // 100% of whole layout
			},
		};		
	}

	render() {
		// if (!this.props.screeData || this.props.screeData.length === 0)
		// 	return <div />
		// https://bl.ocks.org/NGuernse/8dc8b9e96de6bedcb6ad2c5467f5ef9a
		const _self = this;
		const { screeData } = this.props;

		var margin = {top: 25, right: 25, bottom: 25, left: 25},
		  	width = this.layout.width - margin.left - margin.right, // Use the window's width 
		  	height = this.layout.height - margin.top - margin.bottom; // Use the window's height

		this.svg_description = new ReactFauxDOM.Element('svg');
		this.svg_error = new ReactFauxDOM.Element('svg');
		this.svg_stability = new ReactFauxDOM.Element('svg');
		this.svg_interpretability = new ReactFauxDOM.Element('svg');

		this.svg_description.setAttribute('width', width + margin.left + margin.right);
		this.svg_description.setAttribute('height', height + margin.top + margin.bottom);
		this.svg_description.setAttribute('transform', "translate(" + 0 + "," + 0 + ")");

		this.svg_error.setAttribute('width', width + margin.left + margin.right);
		this.svg_error.setAttribute('height', height + margin.top + margin.bottom);
		this.svg_error.setAttribute('transform', "translate(" + margin.left + "," + margin.top + ")");
		this.svg_stability.setAttribute('width', width + margin.left + margin.right);
		this.svg_stability.setAttribute('height', height + margin.top + margin.bottom);
		this.svg_stability.setAttribute('transform', "translate(" + (margin.left + (this.layout.width)*1) + "," + (margin.top- (this.layout.height)*1) + ")");
		this.svg_interpretability.setAttribute('width', width + margin.left + margin.right);		
		this.svg_interpretability.setAttribute('height', height + margin.top + margin.bottom);
		this.svg_interpretability.setAttribute('transform', "translate(" + (margin.left + (this.layout.width)*2) + "," + (margin.top- (this.layout.height)*2) + ")");		
		// d3.select(this.svg_description).append("text").text("#Pattens");
		// d3.select(this.svg_description).append("text").text("#Descriptors");

		var error_data = d3.range(screeData.error.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.error[d]);
			return {"x": d, "y": rst[0], "e":rst[1]};
		}), stability_data = d3.range(screeData.stability.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.stability[d]);
			return {"x": d, "y": rst[0], "e":rst[1]};
		}), interpretability_data = d3.range(screeData.interpretability.length).map(function(d, i) {
			var rst = computeMeanStd(screeData.interpretability[d]);
			return {"x": d, "y": rst[0], "e":rst[1]};
		})
		
		var n = screeData.error.length;

		plot_linechart(this.svg_error, error_data, margin, width, height);
		plot_linechart(this.svg_stability, stability_data, margin, width, height);
		plot_linechart(this.svg_interpretability, interpretability_data, margin, width, height, n);


		// Compute the scree (mean, std) for each metric
		function computeMeanStd(array_list){
			var n = array_list.length
			var mean_ = array_list.reduce((a,b) => a+b)/n;
			var std_ = Math.sqrt(array_list.map(x => Math.pow(x - mean_, 2)).reduce((a,b)=>a+b)/n);
			return [mean_, std_]
		}

		function plot_linechart(cur_svg, dataset, margin, width, height){

			var svg = d3.select(cur_svg).append("g")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			var xScale = d3.scaleLinear()
			    .domain([0, n-1]) // input
			    .range([0, width]); // output

			// 6. Y scale will use the randomly generate number 
			var yScale = d3.scaleLinear()
			    .domain([0, d3.max(dataset, (d) => d.y + d.e)]) // input 
			    .range([height, 0]); // output 

			// 7. d3's line generator
			var line = d3.line()
			    .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
			    .y(function(d) { return yScale(d.y); }) // set the y values for the line generator 
			    .curve(d3.curveMonotoneX) // apply smoothing to the line

			// 3. Call the x axis in a group tag
			svg.append("g")
			    .attr("class", "x axis")
			    .attr("transform", "translate(0," + height + ")")
			    .call(d3.axisBottom(xScale).ticks(n)); // Create an axis component with d3.axisBottom

			// 4. Call the y axis in a group tag
			svg.append("g")
			    // .attr("class", "y axis")
			    .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

			// 9. Append the path, bind the data, and call the line generator 
			svg.append("path")
			    .datum(dataset) // 10. Binds data to the line 
			    // .attr("class", "line") // Assign a class for styling 
			    .attr("d", line) // 11. Calls the line generator 
			    .attr("fill", "none")
			    .attr("stroke", "#ffab00")
			    .attr("stroke-width", 3);


			// 12. Appends a circle for each datapoint 
			svg.selectAll(".dot")
			    .data(dataset)
			  .enter().append("circle") // Uses the enter().append() method
			    // .attr("class", "dot") // Assign a class for styling
			    .attr("cx", function(d, i) { return xScale(i) })
			    .attr("cy", function(d) { return yScale(d.y) })
			    .attr("r", 5);


			// Add Error Line
			svg.append("g").selectAll("line")
				.data(dataset).enter()
				.append("line")
				.attr("class", "error-line")
				.attr("stroke", "#b30059")
				.attr("stroke-dasharray", "2.2")			
				.attr("x1", function(d, i) {
					return xScale(i);
				})
				.attr("y1", function(d) {
					return yScale(d.y + d.e);
				})
				.attr("x2", function(d, i) {
					return xScale(i);
				})
				.attr("y2", function(d) {
					return yScale(d.y - d.e);
				});

			// Add Error Top Cap
			svg.append("g").selectAll("line")
				.data(dataset).enter()
				.append("line")
				.attr("class", "error-cap")
				.attr("stroke", "#b30059")
				.attr("stroke-width", "2px")
				.attr("stroke-type", "solid")			
				.attr("x1", function(d, i) {
					return xScale(i) - 4;
				})
				.attr("y1", function(d) {
					return yScale(d.y + d.e);
				})
				.attr("x2", function(d, i) {
					return xScale(i) + 4;
				})
				.attr("y2", function(d) {
					return yScale(d.y + d.e);
				});

			// Add Error Bottom Cap
			svg.append("g").selectAll("line")
				.data(dataset).enter()
				.append("line")
				.attr("class", "error-cap")
				.attr("stroke", "#b30059")
				.attr("stroke-width", "2px")
				.attr("stroke-type", "solid")						
				.attr("x1", function(d, i) {
					return xScale(i) - 4;
				})
				.attr("y1", function(d) {
					return yScale(d.y - d.e);
				})
				.attr("x2", function(d, i) {
					return xScale(i) + 4;
				})
				.attr("y2", function(d) {
					return yScale(d.y - d.e);
				});

			// Add Scatter Points
			svg.append("g").attr("class", "scatter")
				.selectAll("circle")
				.data(dataset).enter()
				.append("circle")
				.attr("cx", function(d, i) {
					return xScale(i);
				})
				.attr("cy", function(d) {
					return yScale(d.y);
				})
				.attr("r", 4);			
		}



	  return (
			<div className={styles.ControlView}>
				<div id="area1">
					{this.svg_error.toReact()}
				</div>
				<div id="area2">
					{this.svg_stability.toReact()}				
				</div>
				<div id="area3">
					{this.svg_interpretability.toReact()}				
				</div>

			</div>
	  );

	}
}

export default ControlView;
