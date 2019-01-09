import React, { Component } from 'react';
import * as d3 from 'd3';

export function computeMeanStd(array_list){
	var n = array_list.length
	var mean_ = array_list.reduce((a,b) => a+b)/n;
	var std_ = Math.sqrt(array_list.map(x => Math.pow(x - mean_, 2)).reduce((a,b)=>a+b)/n);
	return [mean_, std_]
}


export	function plot_linechart(cur_svg, dataset, margin, width, height, n, title = ""){

		var start_index = 2,
			title1 = "good",
			title2 = "bad",
			svg = d3.select(cur_svg).append("g")					
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
			xScale = d3.scaleLinear()
		    .domain([start_index, n-1+2]) // input
		    .range([0, width]), // output
		// 6. Y scale will use the randomly generate number 
		 	yScale = d3.scaleLinear()
		    .domain([0, d3.max(dataset, (d) => d.y + d.e)]) // input 
		    .range([height, 0]), // output 
		// 7. d3's line generator
			line = d3.line()
		    .x(function(d, i) { return xScale(d.x); }) // set the x values for the line generator
		    .y(function(d) { return yScale(d.y); }) // set the y values for the line generator 
		    .curve(d3.curveMonotoneX); // apply smoothing to the line

		if(title == "Model Stability"){
			title1 = "bad"
			title2 = "good"
		}
		// 3. Call the x axis in a group tag
		svg.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(d3.axisBottom(xScale).ticks(5)); // Create an axis component with d3.axisBottom

		// 4. Call the y axis in a group tag
		svg.append("g")
		    // .attr("class", "y axis")
		    .call(d3.axisLeft(yScale).ticks(0)); // Create an axis component with d3.axisLeft

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
		    .attr("cx", function(d, i) { return xScale(d.x) })
		    .attr("cy", function(d) { return yScale(d.y) })
		    .attr("r", 2);


		svg.append("text")
			.attr("x", (width / 2)+8)             
			.attr("y", 0 - (margin.top / 2 + 10))
			.attr("dy", "1em")
			.attr("font-size", "10px")
			.style("text-anchor", "middle")
	        .style("text-decoration", "underline")  				
			.text(title)
			.attr("class", "y axis label");

		svg.append("text")
			// .attr("transform", "rotate(-90)")
			.attr("x", 0 - 8)             
			.attr("y", 0 - (margin.top / 2 + 10))
			.attr("dy", "1em")
			.attr("font-size", "8px")
			.style("text-anchor", "middle")
			.text(title2); 			

		svg.append("text")
			// .attr("transform", "rotate(-90)")
			.attr("x", 0 - 8)             
			.attr("y", height)
			.attr("dy", "1em")
			.attr("font-size", "8px")
			.style("text-anchor", "middle")
			.text(title1); 			


		// Add Error Line
		svg.append("g").selectAll("line")
			.data(dataset).enter()
			.append("line")
			.attr("class", "error-line")
			.attr("stroke", "#b30059")
			.attr("stroke-dasharray", "2.2")			
			.attr("x1", function(d, i) {
				return xScale(d.x);
			})
			.attr("y1", function(d) {
				return yScale(d.y + d.e);
			})
			.attr("x2", function(d, i) {
				return xScale(d.x);
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
				return xScale(d.x) - 4;
			})
			.attr("y1", function(d) {
				return yScale(d.y + d.e);
			})
			.attr("x2", function(d, i) {
				return xScale(d.x) + 4;
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
				return xScale(d.x) - 4;
			})
			.attr("y1", function(d) {
				return yScale(d.y - d.e);
			})
			.attr("x2", function(d, i) {
				return xScale(d.x) + 4;
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
				return xScale(d.x);
			})
			.attr("cy", function(d) {
				return yScale(d.y);
			})
			.attr("r", 4);			
	}

