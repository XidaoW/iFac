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
			width: 1050,
			height: 1050,
			svg: {
			width: 1050, // 90% of whole layout
			height: 1050 // 100% of whole layout
		},
	};

	this.pie;	
	this.petals;	
	this.circle_position_x;
	this.circle_position_y;
	this.svg;
	this.circle_color;
	this.circle_width;
	this.compare_N = 3;
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
	this.circularInnerRadius = gs.circularInnerRadius;

  }


  render() {
	const { data, selectedPatterns,
		mostSimilarPatternToSelectedPatternIdx,
		leastSimilarPatternToSelectedPatternIdx, 
		arc_positions_bar_petal,item_max_pattern,
		bar_data, max_pattern_item,components_cnt,modes } = this.props;        
	const margin = {top: this.detailViewMarginTop, right: this.detailViewMarginRight, 
		bottom: this.detailViewMarginBottom, left: this.detailViewMarginLeft},
		width = +this.layout.svg.width - margin.left - margin.right,
	  	height = +this.layout.svg.height - margin.top - margin.bottom;

	const outerRadius = Math.min(width, height) - 100,
		innerRadius = this.circularInnerRadius,
		max_tsne = data[0].max_tsne,
		min_tsne = data[0].min_tsne;
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
	this.circle_position_x = d3.scaleLinear().domain([min_tsne[0],max_tsne[0]]).range([- 0,+ innerRadius]);
	this.circle_position_y = d3.scaleLinear().domain([min_tsne[1],max_tsne[1]]).range([- 0, + innerRadius]);
	var translate_x = 0;
	var translate_y = 0;
	svg.setAttribute('width', width);
	svg.setAttribute('height',height);
	svg.setAttribute('transform', "translate(" + translate_x + "," + translate_x + ")");


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
					.attr('transform', "translate(" + ((width)/2-(innerRadius)/2) + "," + ((height)/2-( innerRadius)/2) + ")") 					
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
				.attr("id", (d) => "pattern_" + d.id)                
				.attr("transform", function(d, i) { 
					return "translate(" + _self.circle_position_x(d.tsne_coord.x) + "," 
							+ _self.circle_position_y(d.tsne_coord.y) + ")"; 
				  })
				.on("click", (d) => {
					if (d3.select("#pattern_" + d.id).classed("selected")) {
						_self.props.onUnClickPattern(d.id);
						var cancel_color = d3.select("#pattern_" + d.id).attr("stroke");
						d3.select("#pattern_" + d.id).classed("selected", false);                                       
						d3.select("#pattern_" + d.id).attr("stroke", "none");
					} else {
						if(selectedPatterns.length < this.compare_N){
							var petals_path_items = d3.range(this.petals).map(function(p){
								return {
										"d_flower":backdrop.select('path#petal_'+d.id+'_'+p+'.petal').attr("d"),
										"translate_flower": backdrop.select('#flower_'+d.id).attr("transform"),
										"d_bar": backdrop.select('path#bar_'+p+'_'+max_pattern_item[p][d.id]).attr("d"),
										"item": max_pattern_item[p][d.id],
										"descriptor_index": p,
										"pattern_id": d.id
									}
							});							
							_self.props.onClickPattern(d.id, petals_path_items, innerRadius, outerRadius);
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
					return "translate(" + _self.circle_position_x(d.tsne_coord.x) + "," 
							+ _self.circle_position_y(d.tsne_coord.y) + ")"; 
				});
	// ADD THE PETALS TO FLOWERS ==> DESCRIPTORS                
	const petals = flowers.selectAll(".petal")
				.data((d) => this.pie(d.petals))
				.enter().append("path")
				.attr("class", "petal")
				.attr("id", (d) => "petal_"+d.data.id+"_" + d.index)
				.attr("transform", (d) => petal.rotateAngle((d.startAngle + d.endAngle) / 2))
				.attr("d", (d) => petal.petalPath(d, this.outerCircleRadius))
				.style("stroke", (d, i) => 'gray')
				.attr("stroke-width", function(d) {   
					  // console.log(d);
					// console.log(d3.select("#pattern_" + d.data.id).attr("stroke"))                   
					if (mostSimilarPatternToSelectedPatternIdx.length > 0){                        
						if(d.data.id == mostSimilarPatternToSelectedPatternIdx[d.index]){
							return '2px'; 
						}else{
							return '1px'; 
						}                 
					}else{
						return '1px';
					}  

				})
				.attr("stroke", function(d) {   
					
					if (mostSimilarPatternToSelectedPatternIdx.length > 0){                        
						if(selectedPatterns.length > 0){
							var cur_color_stroke = d3.select("#pattern_" + selectedPatterns.slice(-1)).attr("stroke");                   	
						}

						if(d.data.id == mostSimilarPatternToSelectedPatternIdx[d.index]){
							return cur_color_stroke; 
						}else{
							return 'black'; 
						}                 
					}else{
						return 'black';
					}  
				})
			 //  	.on("mouseover", function(d) {
				// 	div_tooltip.transition()
				// 		.duration(200)
				// 		.style("opacity", .9);

				// 	var t = d3.select(this.parentNode).attr("transform");
				// 	var translate = t.substring(t.indexOf("(")+1, t.indexOf(")")).split(",");

				// 	div_tooltip
				// 		.html("Entropy: " + d.data.length + "</br>" + "Similarity: " + d.data.width)
				// 		.style("left", translate[0] + "px")
				// 		.style("top", translate[1] + "px");
				// })
				// .on("mouseout", function(d) {
				// 	div_tooltip.transition()
				// 		.duration(500)
				// 		.style("opacity", 0);
				// })              
				.style("fill", (d, i) => petal.petalFill(d, i, this.petals))
				.style('fill-opacity', 0.8);

	// DRAW THE RADIAL BAR CHART
	for(var descriptor_index = 0; descriptor_index < descriptor_size; descriptor_index++){
		// draw the bar for the default values
		draw_bars_circular(bar_data, descriptor_index, max_pattern_item, [components_cnt], descriptor_size, margin, width, height, label_flag = true)
		// if there are patterns being selected
		if (selectedPatterns.length > 0) {
			draw_bars_circular(bar_data, descriptor_index, max_pattern_item, selectedPatterns, descriptor_size, margin, width, height, label_flag = false);
			var line = d3.line()
						.x(function (d) { return (d.x); })
						.y(function (d) { return (d.y); });

			gFlowers.append("path")
							.attr("class", "plot")
							.attr("stroke", "grey")
							.attr("stroke-width", 2)
							.attr("stroke-dasharray", "1,5")
							.attr("fill", "none")
							.attr("d", line(arc_positions_bar_petal[descriptor_index]));

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
					// .attr("transform", "translate(" + (width / 2) + "," + ( height/2 )+ ")"); 

		
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
			.attr("id", (d)=> "bar_"+descriptor_index+'_'+d.key)
			.attr("fill", function(d) { 
				// console.log(d)
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
				.attr("id", (d) => "label_"+descriptor_index+"_"+d.key)
				.attr("alignment-baseline", "middle")       
				.on("click", (d) => {
					console.log(d);
					console.log(backdrop.select('path#petal_'+max_pattern_id+'_'+descriptor_index+'.petal').matrixTransform());
					var max_pattern_id = item_max_pattern[descriptor_index][d.key],
						link_max_pattern_item_data = {
							"d_flower":backdrop.select('path#petal_'+max_pattern_id+'_'+descriptor_index+'.petal').attr("d"),
							"translate_flower": backdrop.select('#flower_'+max_pattern_id).attr("transform"),
							"d_bar": backdrop.select('path#bar_'+descriptor_index+'_'+d.key).attr("d"),
							"item": d.key,
							"descriptor_index": descriptor_index,
							"pattern_id": d.id
						};

			})
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