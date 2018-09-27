import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';

import _ from 'lodash';
import styles from './styles.scss';
import index from '../../index.css';
// import gs from '../../config/_variables.scss'; // gs (=global style)

class OverView extends Component {
	constructor(props) {
		super(props);
		// console.log(props);
		this.pie;
		this.svg;
		this.layout = {
			width: 850,
			height: 550,
			svg: {
				width: 850, // 90% of whole layout
				height: 550 // 100% of whole layout
			},
		};
		this.petals = 3;
		this.halfRadius = 15;
		this.circleRadius = 10;

	}

	render() {
		if (!this.props.data || this.props.data.length === 0)
			return <div />

		const _self = this;
		const { data } = this.props;

		this.svg = new ReactFauxDOM.Element('svg');
		this.svg.setAttribute('width', this.layout.svg.width);
		this.svg.setAttribute('height', this.layout.svg.height);
		this.svg.setAttribute('transform', "translate(" + this.halfRadius * 3 + "," + this.halfRadius * 3 + ")");		
		this.pie = d3.pie().sort(null).value(function(d) { return 1; });

		// PLOT THE BACKDROP
		const backdrop = d3.select(this.svg)
						.append('g')
						.attr("class", "background");

		// PLOT THE FLOWERS
		const flowers = backdrop.selectAll('.flower')
								.data(data)
								.enter().append('g')
								.attr("class", "flower")
								.attr("transform", function(d, i) { 
								    return "translate(" + d.x + "," + d.y + ")"; 
									});
		// ADD THE FLOWERS									
		const petals = flowers.selectAll(".petal")
							.data((d) => this.pie(d.petals))
							.enter().append("path")
							.attr("class", "petal")
							.attr("transform", (d) => rotateAngle((d.startAngle + d.endAngle) / 2))
							.attr("d", (d) => petalPath(d, this.halfRadius, this.circleRadius))
							.style("stroke", (d, i) => petalStroke(d, i))
							.style("fill","#66c2a5")
							// .style("fill", (d, i) => petalFill(d, i, this.petals));

		// ADD THE OUTER CIRCLES TO THE BACKDROP									
		const circles1 = backdrop.selectAll('.circle')
								.data(data)
								.enter().append('circle')
								.attr("class", "outer_circle")
								.attr("r", this.halfRadius)
								.attr("fill", "white")
								.attr("stroke-width", 0)
								.attr("opacity", 1)
								.attr("transform", function(d, i) { 
									return "translate(" + d.x + "," + d.y + ")"; 
								});
		// ADD THE INNER CIRCLES TO THE BACKDROP
		const circles = backdrop.selectAll('.circle')
								.data(data)
								.enter().append('circle')
								.attr("class", "inner_circle")
								.attr("r", function(d) { return 6; })
								.attr("fill", "#fc8d62")
								.attr("stroke", "red")
								.attr("stroke-width", 1)
								.attr("id", function(d) { return "pattern_" + d.id; })
								.attr("opacity", function(d) { return d.weight; })													
								.attr("stroke-opacity", 0)																													
								.attr("transform", function(d, i) { 
								    return "translate(" + d.x + "," + d.y + ")"; 
								  })
								.on("click", (d) => {
									if (d3.select("#pattern_" + d.id).classed("selected")) {
										_self.props.onUnClickPattern(d.id);
										d3.select("#pattern_" + d.id).classed("selected", false)
										console.log('in the overview when click: ', _self.props.selectedPatterns);
									} else {
										_self.props.onClickPattern(d.id);
										d3.select("#pattern_" + d.id).classed("selected", true);
										// console.log(_self.props.selectedPatterns);
									}
								});




		function petalPath(d, halfRadius) {		  
			var size_petal_radius = d3.scaleSqrt().domain([0, 1]).range([0, halfRadius]);		
			var size_petal_arc = d3.scaleLinear().domain([0, 1]).range([0, 2 * Math.PI * halfRadius / 3]);

			var angle = (d.endAngle - d.startAngle) / 2,
				s = polarToCartesian(-angle, size_petal_arc(d.data.width), halfRadius),
				e = polarToCartesian(angle, size_petal_arc(d.data.width), halfRadius),
				r = size_petal_radius(d.data.length),     
				m = petalRadius(r, halfRadius),
				c1 = {x: halfRadius + r / 2, y: s.y},
				c2 = {x: halfRadius + r / 2, y: e.y};

			return "M" + s.x + "," + s.y + "Q" + c1.x + "," + c1.y + " " + m.x + "," + m.y +
			"Q" + c2.x + "," + c2.y + " " + e.x + "," + e.y + "Z";

		};

		function petalRadius(r, halfRadius){
			return {
				x: halfRadius + r, 
				y: 0
			}
		}

		function flowerSum(d) {
		  return d3.sum(d.petals, function(d) { return d.length; });
		}


		function rotateAngle(angle) {
		  return "rotate(" + (angle / Math.PI * 180 ) + ")";
		}

		function polarToCartesian(angle, arc_length, halfRadius) {
			
			var angle_arc = arc_length / (2 * Math.PI * halfRadius / 3) * angle
			return {
				// start and end of the petal
				// size of the petal
				x: Math.cos(angle_arc) * halfRadius,
				y: Math.sin(angle_arc) * halfRadius
			};
		};

		function petalFill(d, i, petals) {
		  return d3.hcl(i / petals * 360, 60, 70);
		};

		function petalStroke(d, i,petals) {
		  return d3.hcl(i / petals * 360, 60, 40);
		};

	  return (
			<div className={styles.PatternOverview}>
				<div className={index.title}>Overview</div>
				{this.svg.toReact()}
			</div>
	  );

	}
}

export default OverView;
