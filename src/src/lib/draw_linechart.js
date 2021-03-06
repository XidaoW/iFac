import React, { Component } from 'react';
import * as d3 from 'd3';
import d3tooltip from 'd3-tooltip';

const tooltip = d3tooltip(d3);

function normalize(val, max, min) { 
	if(max - min == 0) return 0; // or 0, it's up to you
	return (val - min) / (max - min); 
}

export function computeMeanStd(array_list){
	// var min_ = Math.min(array_list), 
	// 	max_ = Math.max(array_list);
	// var array_list_ = array_list.map(normalize(max_, min_));
	var n = array_list.length;
	var mean_ = array_list.reduce((a,b) => a+b)/n;
	var std_ = Math.sqrt(array_list.map(x => Math.pow(x - mean_, 2)).reduce((a,b)=>a+b)/n);
	return [mean_, std_]
}


export	function plot_linechart(onClickPoint, cur_svg, dataset, margin, width, height, n, title = "", labels = ["good", "bad"]){
		var start_index = 2,
			error_cap_size = 2,
			title1 = labels[0], 
			title2 = labels[1],
			svg = d3.select(cur_svg).append("g")					
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
			xScale = d3.scaleLinear()
					.domain([start_index, n-1+2]) // input
					.range([0, width]), // output
		    ptSizeScale = d3.scalePow()
					.exponent(1.5)
					.domain([0, 4])
					.range([0,5]),			
			// rankRec = metricPointSize.indexOf(Math.max.apply(Math, metricPointSize)),
		// 6. Y scale will use the randomly generate number 
		 	yScale = d3.scaleLinear()
					.domain([d3.min(dataset, (d) => d.y - d.e), d3.max(dataset, (d) => d.y + d.e)]) // input 
					.range([height, 0]), // output 
		// 7. d3's line generator
			line = d3.line()
					.x(function(d, i) { return xScale(d.x); }) // set the x values for the line generator
					.y(function(d) { return yScale(d.y); }) // set the y values for the line generator 
					.curve(d3.curveMonotoneX); // apply smoothing to the line
		// 3. Call the x axis in a group tag
		svg.append("g")
		    .attr("class", "g_x_axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(d3.axisBottom(xScale).ticks(5).tickSizeOuter(0)); // Create an axis component with d3.axisBottom

		// 4. Call the y axis in a group tag
		svg.append("g")
		    .attr("class", "g_y_axis")
		    .call(d3.axisLeft(yScale).ticks(0).tickSizeOuter(0)); // Create an axis component with d3.axisLeft

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
    		.attr('font-family', 'FontAwesome')			
	        .style("text-decoration", "underline")  				
			.text(title)
			.attr("class", "y axis label")
	     .on("mouseover", function(d) {

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
			.attr("stroke-opacity", 0.1)
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
			.attr("stroke-opacity", 0.1)			
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
			.attr("stroke-opacity", 0.1)					
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
			// .attr("r", (d,i) => ptSizeScale(metricPointSize[i]))
			.attr("class", (d) => "rank"+d.x.toString())
			.attr("opacity", 0.3)
			.attr("id", (d, i) => "rank_index_" + i.toString())
			.attr("stroke", (d, i) => {return "none";})
			.attr("stroke-width", (d, i) => {return "0px";})
			.on("mouseover", function(d, i){
				d3.selectAll("circle.rank"+d.x.toString()).attr("stroke", "#ffab00");
				d3.selectAll("circle.rank"+d.x.toString()).attr("stroke-width", "6px");
				var suggested = "";
				// if(i == rankRec){
				// 	suggested = "Suggested ";
				// }
                tooltip.html('<div>'+ suggested + 'rank: ' + d.x + '</div>'+ '<div>value: ' + d3.format(".0%")(d.y) + '</div>');
                tooltip.show();

			})
			.on("mouseout", function(d){
				d3.selectAll("circle.rank"+d.x.toString()).attr("stroke", "none");				
				// d3.selectAll("circle#rank_index_"+rankRec.toString()).attr("stroke", "#b30059");				
				// d3.selectAll("circle#rank_index_"+rankRec.toString()).attr("stroke-width", "6px");				
				tooltip.hide();
			})			
			.on("click", function(d){
				onClickPoint(d.x);
			});

	}

