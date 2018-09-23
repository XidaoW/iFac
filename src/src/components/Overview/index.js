import React, { Component } from 'react';
import * as d3 from 'd3';
import Grid from 'd3-v4-grid';

import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import index from '../../index.css';
// import gs from '../../config/_variables.scss'; // gs (=global style)

/* props: this.props.ranking
  => selected ranking data
*/
class OverView extends Component {
    // constructor(props) {
    //   super(props);
    // }
    render() {
		const svgPatternOverview = new ReactFauxDOM.Element('svg');

		var width = 960,
		    height = 500,
		    petals = 3,
		    halfRadius = 15,
		    circleRadius = 10,
		    flowers_cnt = 36;

		svgPatternOverview.setAttribute('width', width);
		svgPatternOverview.setAttribute('height', height);
		const g = d3.select(svgPatternOverview).append('g')
					.attr("transform", "translate(" + halfRadius * 3 + "," + halfRadius * 3 + ")");

		// toy dataset
		d3.json("../data/factors.json", function(data) {
		  console.log(data);
		});

		var pie = d3.pie()
		  .sort(null)
		  .value(function(d) { return d.size; });


		var size = d3.scaleSqrt()
		  .domain([0, 1])
		  .range([0, halfRadius]);
		  
		var grid = Grid()
		  .size([width - halfRadius * 6, height - halfRadius * 6]);

		var data = d3.range(flowers_cnt).map(function(d) {
		  return {
		    id: d,
		    petals: d3.range(petals).map(function(d) { return {size: 1}; }),
		    circles: d3.range(1).map(function(d){ return {dominance: Math.random(), radius: circleRadius}; })
		  }
		});

		const flower = d3.select(svgPatternOverview).selectAll('.flower')
		  								 .attr("class", "flower")
										 .data(grid(data))
										 .enter().append('g')		  								 
										 .attr("transform", function(d, i) { 
										     return "translate(" + d.x + "," + d.y + ")"; 
										   });

		  
		const petal = d3.select(flower).selectAll(".petal")
		  .data(function(d) { return pie(d.petals); })
		.enter().append("path")
		  .attr("class", "petal")
		  .attr("transform", function(d) { return r((d.startAngle + d.endAngle) / 2); })
		  .attr("d", petalPath)
		  .style("stroke", petalStroke)
		  .style("fill", petalFill);

		const circle = d3.select(flower).selectAll(".circle")
		  .data(function(d) { return pie(d.circles); })
		  .enter().append("circle")
		  .attr("class", "node")
		  .attr("r", function(d) { return d.data.radius; })
		  .attr("fill", "#f46d43")
		  .attr("opacity", function(d) { return d.data.dominance; })
		  .attr("stroke", "black");
		  // .attr("transform", function(d, i) { 
		  //     return "translate(" + d.x + "," + d.y + ")"; 
		  //   });


		setInterval(update, 400000)

		function update() {
		  data.forEach(function(flower) {
		    flower.petals.forEach(function(d) { d.size = Math.random(); });
		  })
		  data.sort(function(a, b) {
		    return d3.descending(flowerSum(a), flowerSum(b));
		  });

		  flower.data(grid(data), function(d) { return d.id; }).transition().delay(function(d, i) { return 1000 + i * 20; }).duration(1000)
		    .attr("transform", function(d, i) { 
		      return "translate(" + d.x + "," + d.y + ")"; 
		    });
		  
		  petal.data(function(d) { return pie(d.petals); }).transition().duration(1000)
		    .attr("transform", function(d) { return r((d.startAngle + d.endAngle) / 2); })
		    .attr("d", petalPath);
		}

		function petalPath(d) {
		  var angle = (d.endAngle - d.startAngle) / 2,
		      s = polarToCartesian(-angle, halfRadius),
		      e = polarToCartesian(angle, halfRadius),
		      r = size(d.data.size),      
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

		function petalFill(d, i) {
		  return d3.hcl(i / petals * 360, 60, 70);
		};

		function petalStroke(d, i) {
		  return d3.hcl(i / petals * 360, 60, 40);
		};

      return (
        <div className={styles.PatternOverview}>
          <div className={index.title}>Overview</div>
          {svgPatternOverview.toReact()}
        </div>
      );

    }
}

export default OverView;
