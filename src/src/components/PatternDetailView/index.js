import React, { Component } from 'react';
import * as d3 from 'd3';
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

		this.layout = {
			width: 850,
			height: 550,
			svg: {
				width: 850, // 90% of whole layout
				height: 550 // 100% of whole layout
			},
		};
	}

	render() {
		const { data } = this.props;
		var data_ = []

		// Currently Working on the first factors
		for(var i = 0; i < data.length; i++) {
			data_.push(data[i].factors[0].values); 
		}
		var pattern_ids = Object.keys(data_).sort();
		// remove pattern_id
		var items = Object.keys(data_[0]).sort();
		items.pop("id");
		const svg = new ReactFauxDOM.Element('svg');
		svg.setAttribute('width', this.layout.svg.width);
		svg.setAttribute('height', this.layout.svg.height);
		const margin = {top: 20, right: 20, bottom: 100, left: 40},
          width = +this.layout.svg.width - margin.left - margin.right,
          height = +this.layout.svg.height - margin.top - margin.bottom;

		const x0 = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1),
			  x1 = d3.scaleBand().padding(0.05),
          	  y = d3.scaleLinear().rangeRound([height, 0]),
          	  z = d3.scaleOrdinal().range(d3.schemePaired);

		x0.domain(items);
		x1.domain(pattern_ids).rangeRound([0, x0.bandwidth()]);
		y.domain([0, d3.max(data_, function(d) { return d3.max(items, function(key) { return d[key]; }); })]).nice();
		  
		const g = d3.select(svg).append("g")
			.attr("class", "detailView")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		const rect_plot = g.selectAll(".detailView_col")
			.data(data_)
			.enter().append("g")
			.attr("class","detailView_col")
			.attr("transform", function(d) {console.log(d); return "translate(" + x1(d.id) + ",0)"; })
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
			.attr("fill", function(d) { console.log(d.key); return z(d.id); });

		g.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x0))
			.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", ".01em")      
			.attr("transform", function(d) {
				return "rotate(-65)" 
			});		


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
			.text("Probability");

		const legend = g.append("g")
			.attr("font-family", "sans-serif")
			.attr("font-size", 10)
			.attr("text-anchor", "end")
			.selectAll("g")
			.data(pattern_ids.slice().reverse())
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
			.text(function(d) { return "Pattern " + d; });

	  return (
      <div className={styles.PatternOverview}>
        <div className={index.title}>Pattern Detail View</div>
        {svg.toReact()}
      </div>
	  );

	}
}

export default PatternDetailView;
