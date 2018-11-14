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
		this.pie;
		this.svg;
		this.layout = {
			width: 250,
			height: 150,
			svg: {
				width: 250, // 90% of whole layout
				height: 150 // 100% of whole layout
			},
		};
		this.petals = 3;
		this.compare_N = 3;
		
	}

	render() {
		// if (!this.props.scree || this.props.scree.length === 0)
		return <div />

		console.log(this.props);
		const _self = this;
		const { screeData } = this.props;
		this.svg = new ReactFauxDOM.Element('svg');
		this.svg.setAttribute('width', this.layout.svg.width);
		this.svg.setAttribute('height', this.layout.svg.height);
		this.pie = d3.pie().sort(null).value(function(d) { return 1; });
		console.log(screeData);
		var n = screeData.length;
		var y_values = [];
		for(var i = 0; i < n-1; i++){
			y_values.push(screeData[i]['y']);
		}
		
		console.log(y_values);
		var xScale = d3.scaleLinear()
		    .domain([0, n-1]) // input
		    .range([0, this.layout.svg.width]); // output

		// 6. Y scale will use the randomly generate number 
		var yScale = d3.scaleLinear()
		    .domain([0, Math.max(y_values)]) // input 
		    .range([this.layout.svg.height, 0]); // output 

		// 7. d3's line generator
		var line = d3.line()
		    .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
		    .y(function(d) { return yScale(d.y); }) // set the y values for the line generator 
		    // .curve(d3.curveMonotoneX) // apply smoothing to the line

		var dataset = screeData;
		// 3. Call the x axis in a group tag
		d3.select(this.svg).append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + this.layout.svg.height + ")")
		    .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

		// 4. Call the y axis in a group tag
		d3.select(this.svg).append("g")
		    .attr("class", "y axis")
		    .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

		// 9. Append the path, bind the data, and call the line generator 
		d3.select(this.svg).append("path")
		    .datum(dataset) // 10. Binds data to the line 
		    .attr("class", "line") // Assign a class for styling 
		    .attr("d", line); // 11. Calls the line generator 

		// 12. Appends a circle for each datapoint 
		d3.select(this.svg).selectAll(".dot")
		    .data(dataset)
		  .enter().append("circle") // Uses the enter().append() method
		    .attr("class", "dot") // Assign a class for styling
		    .attr("cx", function(d, i) { return xScale(i) })
		    .attr("cy", function(d) { return yScale(d.y) })
		    .attr("r", 5);





	  return (
			<div className={styles.ControlView}>
				<div className={index.title}>ControlView</div>
				{this.svg.toReact()}
			</div>
	  );

	}
}

export default ControlView;
