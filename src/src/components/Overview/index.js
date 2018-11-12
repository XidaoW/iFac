import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import * as petal from '../../lib/draw_petals.js'

import _ from 'lodash';
import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)


class OverView extends Component {
	constructor(props) {
		super(props);
		this.pie;
		this.svg;
		this.layout = {
			width: 650,
			height: 550,
			svg: {
				width: 650, // 90% of whole layout
				height: 550 // 100% of whole layout
			},
		};
		this.petals = 3;
		this.outerCircleRadius = Number(gs.outerCircleRadius);
		this.innerCircleRadius = Number(gs.innerCircleRadius);
		this.innerCircleStrokeWidth = Number(gs.innerCircleStrokeWidth);
		this.innerCircleStrokeOpacity = Number(gs.innerCircleStrokeOpacity);
		this.outerCircleStrokeWidth = Number(gs.outerCircleStrokeWidth);
		this.outerCircleStrokeOpacity = Number(gs.outerCircleStrokeOpacity);
		this.compare_N = 3;
		
	}

	render() {
		if (!this.props.data || this.props.data.length === 0)
			return <div />

		const _self = this;
		const { data, selectedPatterns,mostSimilarPatternToSelectedPatternIdx,leastSimilarPatternToSelectedPatternIdx } = this.props;
		this.petals = data[0].dims;
		console.log(leastSimilarPatternToSelectedPatternIdx);
		this.svg = new ReactFauxDOM.Element('svg');
		this.svg.setAttribute('width', this.layout.svg.width);
		this.svg.setAttribute('height', this.layout.svg.height);
		this.svg.setAttribute('transform', "translate(" + this.outerCircleRadius * 3 + "," + this.outerCircleRadius * 3 + ")");		
		this.pie = d3.pie().sort(null).value(function(d) { return 1; });
		

		// remove used colors for patterns
		var color_list = ["#ffff99", "#fdc086", "#beaed4"];
		for(var i = 0; i < selectedPatterns.length; i++){
			var used_color = d3.select("#pattern_" + selectedPatterns[i]).attr("stroke");		
			color_list.splice( color_list.indexOf(used_color), 1 );
		}
		// PLOT THE BACKDROP
		const backdrop = d3.select(this.svg)
						.append('g')
						.attr("class", "background");

		backdrop.selectAll('.button')
				.append('g')
				.attr('class', 'button')
				.attr("text", "TEST");

		// ADD TOOLTIP
		const div_tooltip = d3.select("body").append("div")
								.attr("id", "tooltip")
								.attr("class", "tooltip")
								.style("opacity", 0);		

		// PLOT THE FLOWERS ==> PATTERNS
		const flowers = backdrop.selectAll('.flower')
								.data(data)
								.enter().append('g')
								.attr("class", "flower")
								.attr("id", (d) => "flower_"+d.id)
								.attr("transform", function(d, i) { 
								    return "translate(" + d.x + "," + d.y + ")"; 
									});
		// ADD THE PETALS TO FLOWERS ==> DESCRIPTORS								
		const petals = flowers.selectAll(".petal")
							.data((d) => this.pie(d.petals))
							.enter().append("path")
							.attr("class", "petal")
							// .attr("class", "petal")
							.attr("transform", (d) => petal.rotateAngle((d.startAngle + d.endAngle) / 2))
							.attr("d", (d) => petal.petalPath(d, this.outerCircleRadius))
							.style("stroke", (d, i) => 'gray')
							.on("mouseover", function(d) {
								div_tooltip.transition()
									.duration(200)
									.style("opacity", .9);

								var t = d3.select(this.parentNode).attr("transform");
								var translate = t.substring(t.indexOf("(")+1, t.indexOf(")")).split(",");

								div_tooltip
									.html("Entropy: " + d.data.length + "</br>" + "Similarity: " + d.data.width)
									.style("left", translate[0] + "px")
									.style("top", translate[1] + "px");
						   })
							.on("mouseout", function(d) {
								div_tooltip.transition()
									.duration(500)
									.style("opacity", 0);
							})							
							.style("fill", (d, i) => petal.petalFill(d, i, this.petals))
							.style('fill-opacity', 0.8);


		// console.log(mostSimilarPatternToSelectedPatternIdx);
	 //    for(var p_idx = 0; p_idx < mostSimilarPatternToSelectedPatternIdx.length; i++){
	 //    	petals.style("stroke", function(d,i,p_idx){
	 //    		if(i == p_idx && d.data.id == mostSimilarPatternToSelectedPatternIdx[p_idx]){
	 //    			return "black";
	 //    		}

	 //    	});
	 //    }

		// ADD THE OUTER CIRCLES TO THE BACKDROP								
		const circles1 = backdrop.selectAll('.circle')
								.data(data)
								.enter().append('circle')
								.attr("class", "outer_circle")
								.attr("r", this.outerCircleRadius)
								.attr("fill", "white")
								.attr("stroke-width", gs.outerCircleStrokeWidth)
								.attr("stroke-opacity", gs.outerCircleStrokeOpacity)
								.attr("fill-opacity", 0)
								.attr("id", function(d) { return "pattern_" + d.id; })								
								.attr("transform", function(d, i) { 
									return "translate(" + d.x + "," + d.y + ")"; 
								})
								.on("click", (d) => {
									if (d3.select("#pattern_" + d.id).classed("selected")) {
										_self.props.onUnClickPattern(d.id);
										var cancel_color = d3.select("#pattern_" + d.id).attr("stroke");
										d3.select("#pattern_" + d.id).classed("selected", false);																				
										d3.select("#pattern_" + d.id).attr("stroke", "none");
									} else {
										if(selectedPatterns.length < this.compare_N){
											_self.props.onClickPattern(d.id);
											d3.select("#pattern_" + d.id).classed("selected", true);
											d3.select("#pattern_" + d.id).attr("stroke", color_list[0]);										
											color_list.splice(0, 1);
										}
									}
								});


		// ADD THE INNER CIRCLES TO THE BACKDROP
		const circles = backdrop.selectAll('.circle')
								.data(data)
								.enter().append('circle')
								.attr("class", "inner_circle")
								.attr("r", gs.innerCircleRadius)
								.attr("fill", "#fc8d62")
								.attr("stroke-width", gs.innerCircleStrokeWidth)								
								.attr("fill-opacity", function(d) { return d.weight; })													
								.attr("stroke-opacity", gs.innerCircleStrokeOpacity)																													
								.attr("transform", function(d, i) { 
								    return "translate(" + d.x + "," + d.y + ")"; 
								  })
								.on("click", (d) => {
									if (d3.select("#pattern_" + d.id).classed("selected")) {
										_self.props.onUnClickPattern(d.id);
										var cancel_color = d3.select("#pattern_" + d.id).attr("stroke");
										d3.select("#pattern_" + d.id).classed("selected", false);																				
										d3.select("#pattern_" + d.id).attr("stroke", "none");
									} else {
										if(selectedPatterns.length < this.compare_N){
											_self.props.onClickPattern(d.id);
											d3.select("#pattern_" + d.id).classed("selected", true);
											d3.select("#pattern_" + d.id).attr("stroke", color_list[0]);										
											color_list.splice(0, 1);
										}
									}
								});
								
								// .on("mouseover", function(d) {
								// 	div_tooltip.transition()
								// 		.duration(200)
								// 		.style("opacity", .9);
								// 	div_tooltip
								// 		.html("Dominance: " + d.weight)
								// 		.style("left", d.x + "px")
								// 		.style("top", d.y + "px");
							 //   })
								// .on("mouseout", function(d) {
								// 	div_tooltip.transition()
								// 		.duration(500)
								// 		.style("opacity", 0);
								// })
								// .on("click", (d) => {
								// 	if (d3.select("#pattern_" + d.id).classed("selected")) {
								// 		_self.props.onMouseOutPattern(d.id);
								// 		d3.select("#pattern_" + d.id).classed("selected", false);																				
								// 	} else {
								// 		_self.props.onMouseOverPattern(d.id);
								// 		d3.select("#pattern_" + d.id).classed("selected", true);
								// 	}
								// });






	  return (
			<div className={styles.PatternOverview}>
				<div className={index.title}>Overview</div>
				{this.svg.toReact()}
				<div className={styles.tooltop}></div>				
			</div>
	  );

	}
}

export default OverView;
