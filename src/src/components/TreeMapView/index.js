import React, { Component } from 'react';
import * as d3 from 'd3';
import * as cloud from 'd3-cloud';
import ReactFauxDOM from 'react-faux-dom';
import d3tooltip from 'd3-tooltip';
import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)
import { Tooltip, Icon } from 'antd';
import {transition} from "d3-transition";
import QueryPanel from 'components/QueryPanel';
import PatternGlyph from 'components/PatternGlyph';

class TreeMapView extends Component {
	
	constructor(props) {
		super(props);

		this.layout = {
			width: 250,
			height: 450,
			svg: {
				width: 250, // 90% of whole layout
				height: 450 // 100% of whole layout
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
		this.handleResetItems = this.handleResetItems.bind(this);				

	}
	// https://github.com/jasondavies/d3-cloud/blob/master/examples/browserify.js

	handleResetPatterns() {
		d3.selectAll('.pattern_circles').attr('stroke-opacity', 0.3);
		d3.selectAll('.pattern_mini_circles').attr('stroke-opacity', 0.3);
		this.props.onResetPatterns();
	}
	handleResetItems() {
		d3.selectAll('.query_bar').classed('queried', false)	
		d3.selectAll('.query_bar').attr("stroke", "none");
		d3.selectAll('.itemTags').remove()
		this.props.onResetItems();		
	}

	render() {
		const { data, bar_data, selectedPatterns, components_cnt, descriptors, modes, queries } = this.props;
		// var cur_data = Object.keys(bar_data).map((d) => {}bar_data[d][0])
		var selectedPatterns_cur;
		if(selectedPatterns.length == 0){
			selectedPatterns_cur = [components_cnt]
		}else{
			selectedPatterns_cur = selectedPatterns
		}
		var cur_data = {children: selectedPatterns_cur.map((idx) => {
			var cur_idx = idx == components_cnt ? "Average" : "Pattern " + idx;
			return {pattern:  cur_idx, children: [{type: "", children: 
				Object.keys(bar_data).map((d, i) => {
				return {descriptor: i, children: 
					Object.keys(bar_data[d][idx]).filter((d) => d !== "id").map((f) => {
						return {item: i + "_" + f, value: bar_data[d][idx][f] * Object.keys(bar_data[d][idx]).length}
					})
				}
			})
			}]}		
		})};
		console.log(descriptors);

		const tooltip = d3tooltip(d3);

		var margin = { top: 5, right: 5, bottom: 25, left: 5 }
		var width = this.layout.svg.width - margin.left - margin.right
		var height = this.layout.svg.height - margin.top - margin.bottom
		d3.select("div#content").selectAll('svg').remove()
		var svg = d3.select("div#content")
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')


		var color_list = ["#85D4E3", "#F4B5BD", "#9C964A", "#CDC08C", "#FAD77B"]
		var orderedDescriptors = Object.keys(bar_data)
		var color = d3.scaleOrdinal()
			.domain(orderedDescriptors)
			.range(color_list)

		var options = {
			key: 'value',
			item: null
		}


		initialize(cur_data);


		function initialize(data) {
			var root = d3.hierarchy(data).sum((d) => d['value'] )
			root.children.sort((a, b) => a.data.pattern - b.data.pattern )

			var x0 = d3.scaleBand()
				.range([0, width])
				.padding(0.01)

			var x1 = d3.scaleBand()
				.domain([''])
				// .paddingInner(0.1)

			var y = d3.scaleLinear()
				.range([0, height])

			var x0Axis = d3.axisBottom()
				.scale(x0)
				// .tickSize(0)


			var x1Axis = d3.axisBottom()
				.scale(x1)

			// var yAxis = d3.axisLeft()
				// .tickSize(-width)

			var gx0 = svg.append('g')
				.attr('class', 'x0 axis')
				.attr('transform', 'translate(0,' + (height) + ')')

			var gy = svg.append('g')
				.attr('class', 'y axis')



			update();


			function sum(d) {
				return !options.item || options.item === d.item ? d['value'] : 0
			}

			function update() {
				root.sum(sum)
				// root.sum(function (d) { return d[key] })
				var t = d3.transition()

				var patternData = root.children
				var typeData = d3.merge(patternData.map((d) => d.children ))

				x0.domain(patternData.map((d) => d.data.pattern).sort())
				x1.rangeRound([0, x0.bandwidth()])
				y.domain([0, d3.max(typeData.map((d) => d.value ))]).nice()

				// We use a copied Y scale to invert the range for display purposes
				// yAxis.scale(y.copy().range([height, 0]))

				var xaxis = gx0.call(x0Axis)
				// var yaxis = gy.call(yAxis)
				xaxis.selectAll("text")
					.style("stroke", (d) => {
						if(d == "Average"){
							return "grey";
						}else{
							var patternIdx = d.replace("Pattern ","")
							return d3.select('#pattern_' + patternIdx).attr('stroke')						
						}
					})

				var patterns = svg.selectAll('.pattern')
					.data(root.children,  (d) => d.data.pattern )

				var enterPatterns = patterns.enter().append('g')
					.attr('class', 'pattern')

				enterPatterns.append('g')
					.attr('class', 'x1 axis')
					.attr('transform', 'translate(0,' + height + ')')
					.call(x1Axis)

				patterns = patterns.merge(enterPatterns)
					.attr('transform', (d) => 'translate(' + x0(d.data.pattern) + ',0)')

				var types = patterns.selectAll('.type')
					.data((d) => d.children ,
						(d) => d.data.type )
					.each(function (d) {
						// UPDATE
						// The copied branches are orphaned from the larger hierarchy, and must be
						// updated separately (see note at L152).
						d.treemapRoot.sum(sum)
						d.treemapRoot.children.forEach(function (d) {
						d.sort((a, b)  => b.value - a.value )
					})
				})

				types = types.enter().append('g')
					.attr('class', 'type')
					.attr('transform', (d) => 'translate(' + x1(d.data.type) + ',' + 0 + ')')
					.each(function (d) {
						// ENTER
						// Note that we can use .each on selections as a way to perform operations
						// at a given depth of the hierarchy tree.
						d.children.sort( (a, b) => orderedDescriptors.indexOf(b.data.descriptor) -
							orderedDescriptors.indexOf(a.data.descriptor)
						)
						d.children.forEach( (d) =>
							d.sort( (a, b) => b.value - a.value )
						)
						d.treemap = d3.treemap().tile(d3.treemapResquarify)

						// The treemap layout must be given a root node, so we make a copy of our
						// child node, which creates a new tree from the branch.
						d.treemapRoot = d.copy()
					})
					.merge(types)
					.each(function (d) {
						// UPDATE + ENTER
						d.treemap.size([x1.bandwidth(), y(d.value)])(d.treemapRoot)
					})

				// d3.hierarchy gives us a convenient way to access the parent datum. This line
				// adds an index property to each node that we'll use for the transition delay.
				root.each(function (d) { d.index = d.parent ? d.parent.children.indexOf(d) : 0 })

				types.transition()
					.delay((d, i) => d.parent.index * 150 + i * 50 )
					.attr('transform', (d) => 'translate(' + x1(d.data.type) + ',' + (height - y(d.value)) + ')'
				);

				var svg_descriptors = types.selectAll('.descriptor')
					// Note that we're using our copied branch.
					.data((d) => d.treemapRoot.children ,
					(d) => d.data.descriptor );

				svg_descriptors = svg_descriptors.enter().append('g')
					.attr('class', 'descriptor')
					.merge(svg_descriptors);

				var items = svg_descriptors.selectAll('.item')
					.data( (d) => d.children ,
						 (d) => d.data.item );

				var enterItems = items.enter().append('rect')
					.attr('class', 'item')
					.attr('x',  (d) => {return d.x0 })
					.attr('width',  (d) => d.x1 - d.x0 )
					.attr('y',  (e) => e.y0 )
					.attr('height',  (d) => d.y1 - d.y0 )
					.style('fill',  (d) => color(d.parent.data.descriptor) )
					.style('fill-opacity',  0.6 )
					.style("stroke", "grey")
					.style("stroke-opacity", 0.4);

					items.enter()
						.append("text")
	        			.attr("class", "ctext")
	        			.text(function(d) { return d.data.item.split('_')[1]; })				        
	        			.call(text2);
				
				svg_descriptors.selectAll(".ctext").style("opacity", (options.item == null) ? 0.4:0);	        			



				items = items.merge(enterItems);

				enterItems
					.on('mouseover', function (d) {
						svg.classed('hover-active', true)   							
						items.classed('hover', function (e) {
							tooltip.html('<div>' + Object.keys(descriptors)[d.parent.data.descriptor] + ": " + d.data.item.split('_')[1] +"(" + d3.format(".0%")(d.data.value) + ")"+ '</div>');
							tooltip.show();
							d3.selectAll('path#bar_' + d.parent.data.descriptor+ '_'+ d.data.item).attr("stroke-width", "2px");
							return e.data.item === d.data.item
						})

					})
					.on('mouseout', function (d) {                
						svg.classed('hover-active', false)
						items.classed('hover', false)
						d3.selectAll('path#bar_' + d.parent.data.descriptor+ '_'+ d.data.item).attr("stroke-width", "0px");
						tooltip.hide();						
					})
					.on('click', function (d) {
						options.item = options.item === d.data.item ? null : d.data.item                              
						update()				
					});              	

				items.filter(function (d) {  d.data.item === options.item })
					.each(function (d) { d3.select(this.parentNode).raise() })
					.raise();
				items
					.transition(t)
					.attr('x', function (d) { return d.value ? d.x0 : x1.bandwidth() / 2 })
					.attr('width', function (d) { return d.value ? d.x1 - d.x0 : 0 })
					.attr('y', function (d) { return d.value ? d.y0 : d.parent.parent.y1 / 2 })
					.attr('height', function (d) { return d.value ? d.y1 - d.y0 : 0 });

		    


				function text2(text) {
					text.attr("x", function(d) { return d.x0; })
						.attr("y", function(d) { return d.y0; })
						.style("font-size", function(d) { return  (d.y1 - d.y0) * Math.pow((d.x1 - d.x0), 1.) / this.getComputedTextLength() / 20  + "px"; })
						.attr("dy", ".8em")						
						.style("opacity", function(d) { return 0.4; });
				}        			
					

			}
		}
		  

		return (
				<div className={styles.DetailView}>
					<div className={index.title}>
						Multi-Faceted Pattern Query
						<Tooltip title="Input item">
							<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
						</Tooltip>																							
					</div>	
					<div className={styles.queryPanel} >			
						<QueryPanel
							onQueryItem={this.props.onClickItem}
							onResetItem={this.handleResetItems}
							descriptors={descriptors}
							components_cnt={components_cnt}
							modes={modes}
							queries={this.props.queries}
						/>	
					</div>				
					<div className={index.title}>
						Content
						<Tooltip title="Pattern narrative as word clouds">
							<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
						</Tooltip>																							
					</div>
					  <div id="content" className={styles.treeMap}>
					  
					  </div>					
				</div>
		);

	}
}

export default TreeMapView;
