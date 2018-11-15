import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import {scaleRadial} from '../../lib/draw_radial.js'


import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)


class PatternDetailView extends Component {
	constructor(props) {
		super(props);

		this.layout = {
			width: 850,
			height: 850,
			svg: {
				width: 850, // 90% of whole layout
				height: 850 // 100% of whole layout
			},
		};
	    this.detailViewMarginTop = gs.detailViewMarginTop;
		this.detailViewMarginBottom = gs.detailViewMarginBottom;
	    this.detailViewMarginLeft = gs.detailViewMarginLeft;
		this.detailViewMarginRight = gs.detailViewMarginRight;
		this.backgroundBarOpacity = gs.detailViewBKBarOpacity;
		this.foregroundBarOpacity = gs.detailViewFGBarOpacity;

	}


	render() {
		const { data, max_pattern_item, selectedPatterns,components_cnt,modes } = this.props;
		const svg = new ReactFauxDOM.Element('svg'),
					descriptor_size = Object.keys(data).length;
		let g;

		svg.setAttribute('width', this.layout.svg.width);
		svg.setAttribute('height', this.layout.svg.height);
		
		const margin = {top: this.detailViewMarginTop, right: this.detailViewMarginRight, 
						bottom: this.detailViewMarginBottom, left: this.detailViewMarginLeft},
			width = +this.layout.svg.width - margin.left - margin.right,
			height = +this.layout.svg.height - margin.top - margin.bottom;
		

		const outerRadius = Math.min(width, height),
				innerRadius = 250;
		var label_flag = false;

		// draw the axis for each descriptor
		for(var descriptor_index = 0; descriptor_index < descriptor_size; descriptor_index++){
			draw_bars_circular(data, descriptor_index, max_pattern_item, [components_cnt], descriptor_size, margin, width, height, label_flag = true)
			if (selectedPatterns.length > 0) {
				draw_bars_circular(data, descriptor_index, max_pattern_item, selectedPatterns, descriptor_size, margin, width, height, label_flag = false);
			}
			
		}
		
		function draw_bars_circular(data, descriptor_index, max_pattern_item, patternIndices, descriptor_size, margin, width, height,label_flag = false){

	        let patterns, items;
	        var descriptor_arcs;
	        patterns = patternIndices.map((pattern_id) => data[descriptor_index][pattern_id]);
	        items = Object.keys(data[descriptor_index][0]).filter((d) => d !== "id").sort();
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
			
  
			g = d3.select(svg).append("g")
				.attr("class", "detailView")
				.attr("id", "descriptor"+descriptor_index)	        
				.attr("transform", "translate(" + (width / 2 + 100) + "," + ( height/2+100 )+ ")"); 

	          // Add the bars
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
            		}	            		
            	}else{
            		return '0px';
            	}	
            })



	          // // Add the labels	   
			if(label_flag){
			 descriptor_arcs.append("g")
			 	.attr("id", "descriptor_text")
			    .attr("text-anchor", function(d) { return (x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
			    .attr("transform", function(d) { return "rotate(" + ((x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length) * 180 / Math.PI - 90) + ")"+"translate(" + (y(d.value)+20) + ",0)"; })
			  	.append("text")
			    .text((d) => d.key)
			    .attr("transform", function(d) { return (x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
			    .style("font-size", "11px")
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
      <div className={styles.PatternOverview}>
        <div className={index.title}>Pattern Detail View</div>			
				{svg.toReact()}
      </div>
	  );

	}
}

export default PatternDetailView;
