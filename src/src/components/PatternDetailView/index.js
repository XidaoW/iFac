import React, { Component } from 'react';
import * as d3 from 'd3';
import factors_data from '../../data/factors.json'
import bar_data from '../../data/data.csv'
import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import index from '../../index.css';
// import gs from '../../config/_variables.scss'; // gs (=global style)

/* props: this.props.ranking
  => selected ranking data
*/
class PatternDetailView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dataset: []
		};
		// svg;
		this.layout = {
			width: 850,
			height: 550,
			svg: {
				width: 850, // 90% of whole layout
				height: 550 // 100% of whole layout
			},
		};
	}

	componentDidMount() {
		const _self = this;
		d3.csv(bar_data).then(function(data){
			_self.setState({
				dataset: data
			});
		});
	}

	render() {
		if (!this.state.dataset || this.state.dataset.length === 0)
			return <div />

		const data = this.state.dataset;
		console.log(data);
		var svg = new ReactFauxDOM.Element('svg');
		svg.setAttribute('width', this.layout.svg.width);
		svg.setAttribute('height', this.layout.svg.height);
		// let data = this.state.dataset;

		var margin = {top: 20, right: 20, bottom: 30, left: 40},
		    width = +this.layout.svg.width - margin.left - margin.right,
		    height = +this.layout.svg.height - margin.top - margin.bottom;


		data.forEach(function(d, columns) {
			for (var i = 1, n = columns.length; i < n; ++i) 
				d[columns[i]] = +d[columns[i]];		
			return d
		});

		var x0 = d3.scaleBand()
		    .rangeRound([0, width])
		    .paddingInner(0.1),

			x1 = d3.scaleBand()
			    .padding(0.05),

			y = d3.scaleLinear()
			    .rangeRound([height, 0]),

			z = d3.scaleOrdinal()
			    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
  
		  var keys = data.columns.slice(1);

		  x0.domain(data.map(function(d) { return d.State; }));
		  x1.domain(keys).rangeRound([0, x0.bandwidth()]);
		  y.domain([0, d3.max(data, function(d) { return d3.max(keys, function(key) { return d[key]; }); })]).nice();

		  console.log(data);

		  const g = d3.select(svg).append("g")
					.attr("class", "detailView")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		  const rect_plot = g.selectAll(".detailView_col")
		    .data(data)
		    .enter().append("g")
		    .attr("class","detailView_col")
		    .attr("transform", function(d) { return "translate(" + x0(d.State) + ",0)"; });
		      

		  console.log(rect_plot);

		  rect_plot.selectAll(".rect")
		    .data(function(d) { 
		    	return keys.map(function(key) { 
		    		console.log({key: key, value: d[key]}); 
		    		return {key: key, value: d[key]}; 
		    	}); 
			})
		    .enter().append("rect")
		    .attr("class", "rect")
		      .attr("x", function(d) { return x1(d.key); })
		      .attr("y", function(d) { return y(d.value); })
		      .attr("width", x1.bandwidth())
		      .attr("height", function(d) { return height - y(d.value); })
		      .attr("fill", function(d) { return z(d.key); });

		  g.append("g")
		      .attr("class", "axis")
		      .attr("transform", "translate(0," + height + ")")
		      .call(d3.axisBottom(x0));

		  g.append("g")
		      .attr("class", "axis")
		      .call(d3.axisLeft(y).ticks(null, "s"))
		    .append("text")
		      .attr("x", 2)
		      .attr("y", y(y.ticks().pop()) + 0.5)
		      .attr("dy", "0.32em")
		      .attr("fill", "#000")
		      .attr("font-weight", "bold")
		      .attr("text-anchor", "start")
		      .text("Population");

		  const legend = g.append("g")
		      .attr("font-family", "sans-serif")
		      .attr("font-size", 10)
		      .attr("text-anchor", "end")
		    .selectAll("g")
		    .data(keys.slice().reverse())
		    .enter().append("g")
		      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		  legend.append("rect")
		      .attr("x", width - 19)
		      .attr("width", 19)
		      .attr("height", 19)
		      .attr("fill", z);

		  legend.append("text")
		      .attr("x", width - 24)
		      .attr("y", 9.5)
		      .attr("dy", "0.32em")
		      .text(function(d) { return d; });

	  return (
		<div className={styles.PatternOverview}>
		  <div className={index.title}>Pattern Detail View</div>
		  {svg.toReact()}
		</div>
	  );

	}
}

export default PatternDetailView;
