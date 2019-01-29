import React, { Component } from 'react';
import * as d3 from 'd3';

export function computeMeanStd(array_list){
	var n = array_list.length
	var mean_ = array_list.reduce((a,b) => a+b)/n;
	var std_ = Math.sqrt(array_list.map(x => Math.pow(x - mean_, 2)).reduce((a,b)=>a+b)/n);
	return [mean_, std_]
}


export	function plot_linechart(cur_svg, dataset, margin, width, height, n, title = "", labels = ["good", "bad"]){

		var start_index = 2,
			error_cap_size = 2,
			title1 = labels[0], 
			title2 = labels[1],
			svg = d3.select(cur_svg).append("g")					
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
			xScale = d3.scaleLinear()
		    .domain([start_index, n-1+2]) // input
		    .range([0, width]), // output
		// 6. Y scale will use the randomly generate number 
		 	yScale = d3.scaleLinear()
		    .domain([d3.min(dataset, (d) => d.y - d.e), d3.max(dataset, (d) => d.y + d.e)]) // input 
		    .range([height, 0]), // output 
		// 7. d3's line generator
			line = d3.line()
		    .x(function(d, i) { return xScale(d.x); }) // set the x values for the line generator
		    .y(function(d) { return yScale(d.y); }) // set the y values for the line generator 
		    .curve(d3.curveMonotoneX); // apply smoothing to the line

		var tooltip = svg.append("div")
			.attr("class", "tooltip")
			.style("opacity", 0);
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
		    .attr("stroke-opacity", 0.3)
		    .attr("stroke-width", 1);


		svg.append("text")
			.attr("x", (width / 2)+8)             
			.attr("y", 0 - (margin.top / 2 + 10))
			.attr("dy", "1em")
			.attr("font-size", "10px")
			.style("text-anchor", "middle")
	        .style("text-decoration", "underline")  				
			.text(title)
			.attr("class", "y axis label")
	     .on("mouseover", function(d) {
	       tooltip.transition()
	         .duration(200)
	         .style("opacity", .9);
	       tooltip.html("test" + "<br/>")
	         .style("left", (d3.event.pageX) + "px")
	         .style("top", (d3.event.pageY - 28) + "px");
	         	     	console.log(tooltip)

	       })
	     .on("mouseout", function(d) {
	       // tooltip.transition()
	       //   .duration(500)
	       //   .style("opacity", 1);
	       });			

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
			.attr("stroke-dasharray", "1.2")
			.attr("stroke-opacity", 0.2)
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
			.attr("stroke-width", "1px")
			.attr("stroke-type", "solid")
			.attr("stroke-opacity", 0.2)			
			.attr("x1", function(d, i) {
				return xScale(d.x) - error_cap_size;
			})
			.attr("y1", function(d) {
				return yScale(d.y + d.e);
			})
			.attr("x2", function(d, i) {
				return xScale(d.x) + error_cap_size;
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
			.attr("stroke-opacity", 0.2)					
			.attr("x1", function(d, i) {
				return xScale(d.x) - error_cap_size;
			})
			.attr("y1", function(d) {
				return yScale(d.y - d.e);
			})
			.attr("x2", function(d, i) {
				return xScale(d.x) + error_cap_size;
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
			.attr("r", 2)
			.attr("class", (d) => "rank"+d.x.toString())
			.attr("opacity", 0.3)
			.on("mouseover", function(d){
				d3.selectAll("circle.rank"+d.x.toString()).attr("stroke", "#ffab00");
				d3.selectAll("circle.rank"+d.x.toString()).attr("stroke-width", "6px");
			})
			.on("mouseout", function(d){
				d3.selectAll("circle.rank"+d.x.toString()).attr("stroke", "none");
			})			
			.on("click", function(d){
				// _self.props.onClickPoint(d.x);
			});

	}

