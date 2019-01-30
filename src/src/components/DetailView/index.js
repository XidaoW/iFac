import React, { Component } from 'react';
import * as d3 from 'd3';
import * as cloud from 'd3-cloud';
import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)


class DetailView extends Component {
	
	constructor(props) {
		super(props);

		this.layout = {
			width: 500,
			height: 850,
			svg: {
				width: 500, // 90% of whole layout
				height: 850 // 100% of whole layout
			},
			detailView: {
				margin: {
					top: gs.detailViewMarginTop,
					bottom: gs.detailViewMarginBottom,
					left: gs.detailViewMarginLeft,
					right: gs.detailViewMarginRight
				}
			}			
		};
	  	this.detailViewMarginTop = gs.detailViewMarginTop;
		this.detailViewMarginBottom = gs.detailViewMarginBottom;
	  	this.detailViewMarginLeft = gs.detailViewMarginLeft;
		this.detailViewMarginRight = gs.detailViewMarginRight;
		this.backgroundBarOpacity = gs.detailViewBKBarOpacity;
		this.foregroundBarOpacity = gs.detailViewFGBarOpacity;
	}
	// https://github.com/jasondavies/d3-cloud/blob/master/examples/browserify.js


	render() {
		const { bar_data, selectedPatterns,components_cnt } = this.props;

		const svg = new ReactFauxDOM.Element('svg');
		svg.setAttribute('width', this.layout.svg.width);
		svg.setAttribute('height', this.layout.svg.height);
		
		var default_ptn_idx = components_cnt,
			select_cnt = selectedPatterns.length,
			descriptor_size = Object.keys(bar_data).length;

		var g, cur_cloud, cur_data, word_size, words, layout;

		var margin = {top: 5, right: 5, bottom: 0, left: 5},
			width = +this.layout.svg.width - margin.left - margin.right,
			height = +this.layout.svg.height - margin.top - margin.bottom;

		if( select_cnt > 0){
			default_ptn_idx = (select_cnt==1)?selectedPatterns[0]:selectedPatterns[1]
		}
		for(var descriptor_index = 0; descriptor_index < descriptor_size; descriptor_index++){
			plot_word_cloud(descriptor_index, descriptor_size, default_ptn_idx, bar_data, height, width);
		}


		function plot_word_cloud(descriptor_index, descriptor_size, default_ptn_idx, bar_data, height, width){
			/**
			 * Draws word cloud based on the descriptor
			 * 
			 * Because descriptor data includes additonal key 'id', we need to filter this item first
			 * word color is matched to the descriptor color with axisStroke
			 * The wordcloud transform, height and width need to be further investigated to make them side by side
			 *  	with the circular view
			 * When users mouseover the word, the bar with the same item is highlighted to
			 * Bug exists when two patterns are selected, see details in code.
			 * @since      0.0.0
			 *
			 * @param {var}   descriptor_index       the descriptor index.
			 * @param {var}   descriptor_size       the number of descriptor.
			 * @param {var}   default_ptn_idx       the pattern number to be shown.
			 * @param {var}   bar_data       the patterns data.
			 * @param {var}   height       the height of wordcloud.
			 * @param {var}   width       the width of wordcloud.
			 * 
			 */
			cur_data = Object.keys(bar_data[descriptor_index][default_ptn_idx]).filter((d) => d !== 'id').reduce((obj, item) => {
				obj[item] = bar_data[descriptor_index][default_ptn_idx][item];
				return obj;
			}, {});
			word_size = d3.scaleLinear().domain([d3.min(d3.values(cur_data)),d3.max(d3.values(cur_data))]).range([10,30]);
			words = Object.keys(cur_data).map(function(key){			
					return {
							text: key, 
							size: word_size(cur_data[key]),
							color: axisStroke(descriptor_index,descriptor_size)
							};
				});

			g = d3.select(svg)
			        .append("g")
			        .attr("transform", "translate(" + 0 + "," + descriptor_index*250  + ")");	
	       g.append("rect")
       			.attr("x", 0)
       			.attr("y", 0)
       			.attr("height", 250)
       			.attr("width", 250)
       			.style("stroke", "black")
       			.style("fill", "none")
       			.style("stroke-width", 1);


			layout = cloud()
			    .size([250, 250])
			    .words(words)
			    .padding(5)
			    .rotate(0)
			    .random(function(d) { return 0.5; })
			    .font("Impact")
			    .fontSize(function(d) { return d.size; })
			    .on("end", draw);

			layout.start();
			function draw(words) {
				cur_cloud = g.append("svg")
					.attr("width", layout.size()[0])
					.attr("height", layout.size()[1])
					.append("g")
					.attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
					.selectAll("text")
					.data(words)
					.enter().append("text")
					.style("font-size", function(d) { return d.size + "px"; })
					.style("font-family", "Impact")
					.style("fill", function(d) { return d.color; })
					.attr("text-anchor", "middle")
					.attr("transform", function(d) {
						return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
					})
					.text(function(d) { return d.text; })
					.on("mouseover", function(d){
						d3.selectAll('path#bar_' + descriptor_index+ '_'+ d.text).attr("stroke-width", "2px");							
					})
					.on("mouseout", function(d){
						d3.selectAll('path#bar_' + descriptor_index+ '_'+ d.text).attr("stroke-width", "0px");							
					})
			}

		};
	
		function axisStroke(i, descriptor_size) {
			return d3.hcl(i / descriptor_size * 360, 60, 70);
		};
		  

		return (
				<div className={styles.DetailView}>
					{svg.toReact()}
				</div>
		);

	}
}

export default DetailView;
