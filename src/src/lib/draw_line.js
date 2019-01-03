import React, { Component } from 'react';
import * as d3 from 'd3';
export function plot_linechart(svg, dataset, width, height){
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

	// 1. Add the SVG to the page and employ #2
	var svg = d3.select("body").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// var dataset = screeData;
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

