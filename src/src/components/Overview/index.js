import React, { Component } from 'react';
import * as d3 from 'd3';
import Grid from 'd3-v4-grid';
import ReactFauxDOM from 'react-faux-dom';

import _ from 'lodash';
import styles from './styles.scss';
import index from '../../index.css';
// import gs from '../../config/_variables.scss'; // gs (=global style)

class OverView extends Component {
	constructor(props) {
		super(props);

		this.pie;
		this.size;
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
		
		this.pie = d3.pie().sort(null).value(function(d) { return d.size; });
		this.size = d3.scaleSqrt()
					.domain([0, 1])
					.range([0, this.halfRadius]);

		const background = d3.select(this.svg)
						.append('g')	
						.attr("class", "background");

		const flowers = background.selectAll('.flower')
								.data(data)
								.enter().append('g')
								.attr("transform", function(d, i) { 
								    return "translate(" + d.x + "," + d.y + ")"; 
									});
									
		const petals = flowers.selectAll(".petal")
							.data((d) => this.pie(d.petals))
							.enter().append("path")
							.attr("class", "petal")
							.attr("transform", (d) => r((d.startAngle + d.endAngle) / 2))
							.attr("d", (d) => petalPath(d, this.halfRadius))
							.style("stroke", (d, i) => petalStroke(d, i))
							.style("fill", (d, i) => petalFill(d, i, this.petals));

		const circles = background.selectAll('.circle')
								.data(data)
								.enter().append('circle')
								.attr("class", "node")
								.attr("r", function(d) { return Math.exp(d.weight)*10; })
								.attr("fill", "white")
								.attr("stroke", "red")
								.attr("stroke-width", 1)
								.attr("transform", function(d, i) { 
								    return "translate(" + d.x + "," + d.y + ")"; 
								  });

		function petalPath(d, halfRadius) {
		  var size = d3.scaleSqrt().domain([0, 1]).range([0, halfRadius]);

		  var angle = (d.endAngle - d.startAngle) / 2,
			  s = polarToCartesian(-angle, halfRadius),
			  e = polarToCartesian(angle, halfRadius),
			  r = size(10),     
			  m = petalRadius(r, halfRadius),
			  c1 = {x: halfRadius + r / 2, y: s.y},
			  c2 = {x: halfRadius + r / 2 , y: e.y};
		  return "M0,0L" + s.x + "," + s.y + "Q" + c1.x + "," + c1.y + " " + m.x + "," + m.y + "L" +  m.x + "," + m.y +
		   "Q" + c2.x + "," + c2.y + " " + e.x + "," + e.y + "Z";

		};
		function petalRadius(r, halfRadius){
		  // removing math random can potentially balance the petal
		  return {x: halfRadius + r + Math.random() * 20, 
				  y: 0}
		}

		function flowerSum(d) {
		  return d3.sum(d.petals, function(d) { return d.size; });
		}

		function r(angle) {
		  return "rotate(" + (angle / Math.PI * 180 ) + ")";
		}

		function polarToCartesian(angle, radius) {
		  return {
			// start and end of the petal
			// size of the petal
			x: Math.cos(angle) * radius* Math.pow(Math.random(),1),
			// y: Math.sin(angle) * radius * Math.random()
			y: Math.sin(angle) * radius* Math.pow(Math.random(),1)
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
