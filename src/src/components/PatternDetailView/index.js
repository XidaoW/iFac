import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
// import * as fisheye from '../../lib/fisheye.js'


import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

/* props: this.props.ranking
  => selected ranking data
*/
class PatternDetailView extends Component {
	constructor(props) {
		super(props);

		this.layout = {
			width: 850,
			height: 1450,
			svg: {
				width: 850, // 90% of whole layout
				height: 550 // 100% of whole layout
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
		const { data, selectedPatterns,components_cnt } = this.props;
		const svg = new ReactFauxDOM.Element('svg'),
					descriptor_size = Object.keys(data).length;
		let g;
		console.log(components_cnt);

		svg.setAttribute('width', this.layout.svg.width);
		svg.setAttribute('height', this.layout.svg.height);
		
		const margin = {top: this.detailViewMarginTop, right: this.detailViewMarginRight, 
						bottom: this.detailViewMarginBottom, left: this.detailViewMarginLeft},
			width = +this.layout.svg.width - margin.left - margin.right,
			height = +this.layout.svg.height - margin.top - margin.bottom;
		
		// draw the axis for each descriptor
		for(var i = 0; i < descriptor_size; i++){
			draw_axis(i, width, height, descriptor_size, data);
			draw_bars(data, i, [20], descriptor_size, margin, width, height);
			if (selectedPatterns.length > 0) {
				draw_bars(data, i, selectedPatterns, descriptor_size, margin, width, height);
			}
		}

		function draw_axis(i, width, height, descriptor_size, data){
			let items;
			items = Object.keys(data[i][0]).filter((d) => d !== "id").sort();
			height = height / descriptor_size;

			const x0 = d3.scaleBand()
							.domain(items)
							.rangeRound([0, width])
							.paddingInner(0.1);

			g = d3.select(svg).append("g")
				.attr("class", "detailView")
				.attr("id", "descriptor"+i)
				.attr("transform", "translate(" + margin.left + "," + ((i)*(height+50)) + ")");

			const axis = g.append("g")
				.attr("class", "axis")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x0))

			axis.selectAll("text")
				.style("text-anchor", "end")
				.attr("dx", "-.8em")
				.attr("dy", ".01em")      
				.attr("transform", (d) => "rotate(-65)")
				.on('mouseover', function(d,i) {
					console.log(d3.select(this));
					d3.select(this).transition()
					.ease(d3.easeCubic)
					.duration('200')
					.attr('font-size', 100)
					.attr('fill', 'springgreen');
				})
				.on('mouseout', function(d,i) {
					d3.select(this).transition()
					.ease(d3.easeCubic)
					.duration('200')
					.attr('font-size', 20)
					.attr('fill', '#333');
				});				

			axis.selectAll("path")
				.attr("stroke", axisStroke(i, descriptor_size))	
				.attr("stroke-width", 3);						
			axis.selectAll("line")
				.attr("stroke", axisStroke(i, descriptor_size))
				.attr("stroke-width", 2);

		
		}

		function axisStroke(i, descriptor_size) {
		  return d3.hcl(i / descriptor_size * 360, 60, 70);
		};

		console.log(data);

	    function draw_bars(data, i, patternIndices, descriptor_size, margin, width, height) {
			let patterns, items;

			patterns = patternIndices.map((pattern_id) => data[i][pattern_id]);
			items = Object.keys(data[i][0]).filter((d) => d !== "id").sort();
			
			height = height / descriptor_size;
			const x0 = d3.scaleBand()
							.domain(items)
							.rangeRound([0, width])
							.paddingInner(0.1),
						x1 = d3.scaleBand()
							.domain(patternIndices)
							.rangeRound([0, x0.bandwidth()])
							.padding(0.05),
						y = d3.scaleLinear()
							.rangeRound([height, 0]),
						z = d3.scaleOrdinal().range(d3.schemePaired);
						// z = d3.scaleOrdinal().range(['#8da0cb','#e78ac3','#a6d854']);

			y.domain([0, d3.max(patterns, (d) =>
					d3.max(items, (key) => d[key])) ]
				).nice();

			g.selectAll(".detailView_col")
				.select("#descriptor" + i)
				.data(patterns)
				.enter().append("g")
				.attr("class","detailView_col")
				.attr("transform", function(d) { 
					return "translate(" + x1(d.id) + ",0)"; 
				})
				.selectAll(".rect")
				.data(function(d) { 
					return items.map(function(key) { 
						return {key: key, value: d[key], id: d.id}; 
					}); 
				})
				.enter().append("rect")
				.attr("class", "rect")
				.attr("x", function(d) { return x0(d.key); })
				.attr("y", function(d) { return y(d.value); })
				.attr("width", x1.bandwidth())
				.attr("height", function(d) { return height - y(d.value); })
				.attr("opacity", function(d) { return barFillOpacity(d.id, i, descriptor_size,this.foregroundBarOpacity, this.backgroundBarOpacity); })
				.attr("fill", function(d) { return barFill(d.id, i, descriptor_size); });
		}
		function barFill(id, descriptor_index, descriptor_size) {
			if(id >= components_cnt){
				return axisStroke(descriptor_index, descriptor_size);
			}else{
				return d3.select("#pattern_" + id).attr("stroke");
			}
		}
		function barFillOpacity(id, descriptor_index, descriptor_size, foregroundBarOpacity, backgroundBarOpacity) {

			if(id >= components_cnt){
				// return backgroundBarOpacity;
				return 0.1;
			}else{
				// return foregroundBarOpacity;
				return 0.8
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
