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
			height: 1450,
			svg: {
				width: 850, // 90% of whole layout
				height: 550 // 100% of whole layout
			},
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		console.log(this.props.selectedPatterns);
		console.log(nextProps.selectedPatterns);
        const differencePatterns = this.props.selectedPatterns !== nextProps.selectedPatterns;
        return differencePatterns;
    }

	render() {
		console.log(this.props);
		console.log(this.state);		

	    if (!this.props.selectedPatterns || this.props.selectedPatterns.length === 0 )
	      return <div />
	  	console.log(this.props);
		const { data } = this.props;
		console.log(this.props.seletedPatterns);
		const svg = new ReactFauxDOM.Element('svg');
		svg.setAttribute('width', this.layout.svg.width);
		svg.setAttribute('height', this.layout.svg.height);
		
		const margin = {top: 10, right: 20, bottom: 200, left: 40},
	          width = +this.layout.svg.width - margin.left - margin.right,
    	      height = +this.layout.svg.height - margin.top - margin.bottom;    
    	let descriptor_size = Object.keys(data).length;
    	for(var i = 0; i < descriptor_size; i++){
    		draw_bar_plot(svg, data, i, margin, width, height/descriptor_size);	
    	}		

    	function draw_bar_plot(svg, data, i, margin, width, height){
    		// temporarily showing 3 patterns
    		var data_ = data[i].slice(0,3);
			const x0 = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1),
				  x1 = d3.scaleBand().padding(0.05),
	          	  y = d3.scaleLinear().rangeRound([height, 0]),
	          	  // z = d3.scaleOrdinal().range(d3.schemePaired);
	          	  z = d3.scaleOrdinal().range(['#8da0cb','#e78ac3','#a6d854']);
	          	  // ['#66c2a5','#fc8d62',]
	        let pattern_ids, items;
	        let g, rect_plot, legend;

			pattern_ids = Object.keys(data_).sort();
			// remove pattern_id
			items = Object.keys(data_[0]).sort();
			items.pop("id");
			x0.domain(items);
			x1.domain(pattern_ids).rangeRound([0, x0.bandwidth()]);
			y.domain([0, d3.max(data_, function(d) { return d3.max(items, function(key) { return d[key]; }); })]).nice();
			  
			g = d3.select(svg).append("g")
				.attr("class", "detailView")
				.attr("transform", "translate(" + margin.left + "," + (i*(height + margin.top)) + ")");

			rect_plot = g.selectAll(".detailView_col")
				.data(data_)
				.enter().append("g")
				.attr("class","detailView_col")
				.attr("transform", function(d) { return "translate(" + x1(d.id) + ",0)"; })
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
				.attr("fill", function(d) { return z(d.id); });

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


			// g.append("g")
			// 	.attr("class", "axis")
			// 	.call(d3.axisLeft(y).ticks(null, "s"))
			// 	.append("text")
			// 	.attr("x", 2)
			// 	.attr("y", y(y.ticks().pop()) + 0.5)
			// 	.attr("dy", "0.32em")
			// 	.attr("fill", "#000")
			// 	.attr("font-weight", "bold")
			// 	.attr("text-anchor", "start")
			// 	.text("");

			// legend = g.append("g")
			// 	.attr("font-family", "sans-serif")
			// 	.attr("font-size", 10)
			// 	.attr("text-anchor", "end")
			// 	.selectAll("g")
			// 	.data(pattern_ids.slice().reverse())
			// 	.enter().append("g")
			// 	.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

			// legend.append("rect")
			// 	.attr("x", width - 19)
			// 	.attr("width", 19)
			// 	.attr("height", 19)
			// 	.attr("fill", z);

			// legend.append("text")
			// 	.attr("x", width - 24)
			// 	.attr("y", 9.5)
			// 	.attr("dy", "0.32em")
			// 	.text(function(d) { return "Pattern " + d; });	    	      		

    	}


	  return (
      <div className={styles.PatternOverview}>
        <div className={index.title}>Pattern Detail View</div>
        {svg.toReact()}
      </div>
	  );

	}
}

export default PatternDetailView;
