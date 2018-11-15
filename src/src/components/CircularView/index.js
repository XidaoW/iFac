import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import {scaleRadial} from '../../lib/draw_radial.js'


import * as petal from '../../lib/draw_petals.js'

import _ from 'lodash';
import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)


/* props: this.props.ranking
  => selected ranking data
*/
class CircularView extends Component {
  
	constructor(props) {
		super(props);
		this.layout = {
			width: 850,
			height: 1050,
			svg: {
			width: 850, // 90% of whole layout
			height: 1050 // 100% of whole layout
		},
	};

	this.pie;
	this.svg;
	this.circle_color;
	this.circle_width;
	this.outerCircleRadius = Number(gs.outerCircleRadius);
	this.innerCircleRadius = Number(gs.innerCircleRadius);
	this.innerCircleStrokeWidth = Number(gs.innerCircleStrokeWidth);
	this.innerCircleStrokeOpacity = Number(gs.innerCircleStrokeOpacity);
	this.outerCircleStrokeWidth = Number(gs.outerCircleStrokeWidth);
	this.outerCircleStrokeOpacity = Number(gs.outerCircleStrokeOpacity);

	this.detailViewMarginTop = gs.detailViewMarginTop;
	this.detailViewMarginBottom = gs.detailViewMarginBottom;
	this.detailViewMarginLeft = gs.detailViewMarginLeft;
	this.detailViewMarginRight = gs.detailViewMarginRight;
	this.backgroundBarOpacity = gs.detailViewBKBarOpacity;
	this.foregroundBarOpacity = gs.detailViewFGBarOpacity;
	this.compare_N = 3;
	this.petals = 3;

  }


  render() {
	const { data, selectedPatterns,mostSimilarPatternToSelectedPatternIdx,leastSimilarPatternToSelectedPatternIdx, 
		bar_data, max_pattern_item,components_cnt,modes } = this.props;        
	const margin = {top: this.detailViewMarginTop, right: this.detailViewMarginRight, 
		bottom: this.detailViewMarginBottom, left: this.detailViewMarginLeft},
		width = +this.layout.svg.width - margin.left - margin.right,
	  	height = +this.layout.svg.height - margin.top - margin.bottom;

	const outerRadius = Math.min(width, height),
		innerRadius = 250;
	const _self = this;        
	
	var svg = new ReactFauxDOM.Element('svg'),
		descriptor_size = Object.keys(bar_data).length,
		color_list = ["#ffff99", "#fdc086", "#beaed4"],
		used_color = '',
		label_flag = false;

	let g; 
	this.pie = d3.pie().sort(null).value(function(d) { return 1; });
	this.circle_color = d3.scaleLinear().domain([0, 1]).range(["#bf5b17","#e31a1c"]).interpolate(d3.interpolateHcl);
	this.circle_width = d3.scaleLinear().domain([0, 1]).range([1,2]);
	this.petals = data[0].dims;

	svg.setAttribute('width', width);
	svg.setAttribute('height',height);

	// svg.setAttribute('transform', "translate(" + width /2 + "," + height /2 + ")");   
	svg.setAttribute('transform', "translate(" + this.outerCircleRadius * 4 + "," + this.outerCircleRadius * 6 + ")");   


	// UPDATE THE LIST OF AVAILABLE COLORS TO PICK FOR CLICKING PATTERNS
	for(var i = 0; i < selectedPatterns.length; i++){
		used_color = d3.select("#pattern_" + selectedPatterns[i]).attr("stroke");   
		color_list.splice( color_list.indexOf(used_color), 1 );
	}
	// PLOT THE BACKDROP
	const backdrop = d3.select(svg)
					.append('g')
					.attr("class", "background"),
				gFlowers = backdrop
					.append('g')
					.attr('transform', 'translate(150,250)')
					.attr('class', 'g_flowers');

	// ADD TOOLTIP
	const div_tooltip = d3.select("body").append("div")
				.attr("id", "tooltip")
				.attr("class", "tooltip")
				.style("opacity", 0);   

	// ADD THE OUTER CIRCLES TO THE BACKDROP
	const circles = gFlowers.selectAll('.circle')
				.data(data)
				.enter().append('circle')
				.attr("class", "outer_circle")
				.attr("r", gs.innerCircleRadius)
				.attr("fill", "#fc8d12")
				// .attr("fill", (d) => this.circle_color(d.weight))
				.attr("stroke-width", gs.innerCircleStrokeWidth)                
				// need to double check if dominance score makes sense
				// .attr("fill-opacity",  0.01)                         
				.attr("fill-opacity", function(d) { return d.weight; })                         
				.attr("stroke-opacity", gs.innerCircleStrokeOpacity)
				// .attr("stroke-opacity", 0.5)
				// .attr("stroke", "black")
				// .attr("stroke-width", (d) => this.circle_width(d.weight))
				.attr("id", function(d) { return "pattern_" + d.id; })                
				.attr("transform", function(d, i) { 
					return "translate(" + (d.x*0.8) + "," + (d.y*0.8) + ")"; 
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
						// d3.selectAll(".petal").attr("stroke-width","1px");               
						color_list.splice(0, 1);
					}
				  }
				});
				
	// PLOT THE FLOWERS ==> PATTERNS
	const flowers = gFlowers.selectAll('.flower')
				.data(data)
				.enter().append('g')
				.attr("class", "flower")
				.attr("id", (d) => "flower_"+d.id)
				.attr("transform", function(d, i) { 
					return "translate(" + (d.x*0.8) + "," + (d.y*0.8) + ")"; 
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
				.attr("stroke-width", function(d) {   
					  // console.log(d);
					// console.log(d3.select("#pattern_" + d.data.id).attr("stroke"))                   
					  // if (mostSimilarPatternToSelectedPatternIdx.length > 0){                        
					  //  if(d.data.id == mostSimilarPatternToSelectedPatternIdx[d.index]){
					  //    return '2px'; 
					  //  }else{
					  //    return '1px'; 
					  //  }                 
					  // }else{
					  //  return '1px';
					  // }  
				})
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


	// DRAW THE RADIAL BAR CHART
	for(var descriptor_index = 0; descriptor_index < descriptor_size; descriptor_index++){
		// draw the bar for the default values
		draw_bars_circular(bar_data, descriptor_index, max_pattern_item, [components_cnt], descriptor_size, margin, width, height, label_flag = true)
		// if there are patterns being selected
		if (selectedPatterns.length > 0) {
			draw_bars_circular(bar_data, descriptor_index, max_pattern_item, selectedPatterns, descriptor_size, margin, width, height, label_flag = false);
		}
	  
	}
	
	function draw_bars_circular(bar_data, descriptor_index, max_pattern_item, patternIndices, descriptor_size, margin, width, height,label_flag = false){

		let patterns, items;
		var descriptor_arcs;
		patterns = patternIndices.map((pattern_id) => bar_data[descriptor_index][pattern_id]);
		items = Object.keys(bar_data[descriptor_index][0]).filter((d) => d !== "id").sort();
		// X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
		const  x = d3.scaleBand()
				.range([2*Math.PI*(descriptor_index+1)/descriptor_size-0.4,  2*Math.PI*(descriptor_index+2)/descriptor_size-0.9])    
				.domain(items) // The domain of the X axis is the list of states.
				.paddingInner(0.05),
		y = scaleRadial()
				.range([innerRadius, outerRadius])   // Domain will be define later.
				.domain([0, 1]), // Domain of Y is from 0 to the max seen in the data
		bar_opacity = d3.scaleLinear()
			.range([0, 1])
			.domain([0, d3.max(patterns, (d) =>
			d3.max(items, (key) => d[key])) ]
		);
		g = backdrop.append("g")
					.attr("class", "detailView")
					.attr("id", "descriptor"+descriptor_index)          
					.attr("transform", "translate(" + (width / 2) + "," + ( height/2 )+ ")"); 

		
		descriptor_arcs = g.selectAll("g")
					.select("#descriptor" + descriptor_index)
					.data(patterns)
					.enter()                                    
					.selectAll("path")
					.data(function(d,cur_index) {
						return items.map(function(key) { 
							return {key: key, value: d[key], id: d.id, index: cur_index};                         
						}); 
					})
					.enter()
		// Add the bars
		descriptor_arcs.append("path")
			.attr("d", d3.arc()     // imagine your doing a part of a donut plot
			.innerRadius(innerRadius)
			.outerRadius((d) => y(d.value))
			.startAngle((d) => x(d.key) + x.bandwidth()*(d.index)/patterns.length)
			.endAngle((d) => x(d.key) + x.bandwidth()*(d.index+1)/patterns.length)
			.padAngle(0.01)
			.padRadius(innerRadius))
			.attr("fill", function(d) { 
				return barFill(d, descriptor_index, descriptor_size, bar_opacity); 
			})
			.attr("opacity", function(d) { return barFillOpacity(d, descriptor_index, descriptor_size,this.foregroundBarOpacity, this.backgroundBarOpacity,bar_opacity); })       
			.attr("stroke", function(d) { 
				return axisStroke(descriptor_index,descriptor_size);
				// return "none";
			})
			.attr("stroke-width", function(d) { 
			// bold the stroke for max_items for each descriptor
			if (typeof max_pattern_item[descriptor_index][d.id] != 'undefined'){
				if(d.key == max_pattern_item[descriptor_index][d.id]){
					return '1px'; 
			}else{
					return '0px'; 
			}}else{
				return '0px';
				} 
			});



		// Add the labels     
		if(label_flag){
			descriptor_arcs.append("g")
				.attr("id", "descriptor_text")
				.attr("text-anchor", function(d) { return (x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
				.attr("transform", function(d) { return "rotate(" + ((x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length) * 180 / Math.PI - 90) + ")"+"translate(" + (y(d.value)+20) + ",0)"; })
				.append("text")
				.text((d) => d.key)
				.attr("transform", function(d) { return (x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
				.style("font-size", "15px")
				.attr("alignment-baseline", "middle")                         
		}

	}


	function axisStroke(i, descriptor_size) {
		return d3.hcl(i / descriptor_size * 360, 60, 70);
	};

	function barFill(d, descriptor_index, descriptor_size,bar_opacity) {
		if(d.id >= components_cnt){
			return axisStroke(descriptor_index, descriptor_size);
		}else{
			var cur_color  = d3.select("#pattern_" + d.id).attr("stroke")       
			var color_dark = d3.rgb(cur_color).darker(0.5);
			var color_light = d3.rgb(cur_color).brighter(0.5);
			var color_pick = d3.scaleLinear().domain([0, 1]).range([color_light,color_dark])
			// return d3.select("#pattern_" + d.id).attr("stroke");
			return color_pick(bar_opacity(d.value));
		}
	}
	function barFillOpacity(d, descriptor_index, descriptor_size, foregroundBarOpacity, backgroundBarOpacity,bar_opacity) {

		if(d.id >= components_cnt){
			return 0.1;
		}else{
			return 1;
		// return bar_opacity(d.value);
		}     
	};

	return (
		<div className={styles.CircularOverview}>
		<div className={index.title}>Circular View</div>      
			{svg.toReact()}
		</div>
	);

  }
}

export default CircularView;