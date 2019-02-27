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


class TreeMapView extends Component {
	
	constructor(props) {
		super(props);

		this.layout = {
			width: 250,
			height: 800,
			svg: {
				width: 250, // 90% of whole layout
				height: 800 // 100% of whole layout
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
		const { bar_data, selectedPatterns, components_cnt } = this.props;
	// var cur_data = Object.keys(bar_data).map((d) => {}bar_data[d][0])
	var selectedPatterns_cur;
	if(selectedPatterns.length == 0){
		selectedPatterns_cur = [components_cnt]
	}else{
		selectedPatterns_cur = selectedPatterns
	}
	var cur_data = {children: selectedPatterns_cur.map((idx) => {
		return {pattern: idx, children: [{type: "Imports", children: 
			Object.keys(bar_data).map((d, i) => {
			return {descriptor: i, children: 
				Object.keys(bar_data[d][idx]).filter((d) => d !== "id").map((f) => {
					return {item: f, value: bar_data[d][idx][f]}
				})
			}
		})
		}]}		
	})};

	const tooltip = d3tooltip(d3);

	var margin = { top: 15, right: 15, bottom: 40, left: 60 }
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

		var dollarFormat = d3.format('$,')
		// var tickFormat = function (n) {
		// 	return n === 0 ? '$0'
		// 		: n < 1000000 ? dollarFormat(n / 1000) + ' billion'
		// 			: dollarFormat(n / 1000000) + ' trillion'
		// }

		var options = {
			key: 'value',
			item: null
		}


		initialize(cur_data);


		function initialize(data) {
			console.log(data);
			var root = d3.hierarchy(data).sum(function (d) { return d['value'] })
			console.log(root);
			root.children.sort(function (a, b) { return a.data.pattern - b.data.pattern })

			var x0 = d3.scaleBand()
				.range([0, width])
				.padding(0.15)

			var x1 = d3.scaleBand()
				.domain(['Imports'])
				.paddingInner(0.1)

			var y = d3.scaleLinear()
				.range([0, height])

			var x0Axis = d3.axisBottom()
				.scale(x0)
				.tickSize(0)

			var x1Axis = d3.axisBottom()
				.scale(x1)

			var yAxis = d3.axisLeft()
				// .tickSize(-width)
				// .tickFormat(tickFormat)

			var gx0 = svg.append('g')
				.attr('class', 'x0 axis')
				.attr('transform', 'translate(0,' + (height + 22) + ')')

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
				var typeData = d3.merge(patternData.map(function (d) { return d.children }))

				x0.domain(patternData.map(function (d) { return d.data.pattern }).sort())
				x1.rangeRound([0, x0.bandwidth()])
				y.domain([0, d3.max(typeData.map(function (d) { return d.value }))]).nice()

				// We use a copied Y scale to invert the range for display purposes
				yAxis.scale(y.copy().range([height, 0]))

				gx0.call(x0Axis)
				gy.call(yAxis)


				var patterns = svg.selectAll('.pattern')
					.data(root.children, function (d) { return d.data.pattern })

				var enterPatterns = patterns.enter().append('g')
					.attr('class', 'pattern')

				enterPatterns.append('g')
					.attr('class', 'x1 axis')
					.attr('transform', 'translate(0,' + height + ')')
					.call(x1Axis)

				patterns = patterns.merge(enterPatterns)
					.attr('transform', function (d) {
						return 'translate(' + x0(d.data.pattern) + ',0)'
				})

				var types = patterns.selectAll('.type')
					.data(function (d) { return d.children },
						function (d) { return d.data.type })
					.each(function (d) {
						// UPDATE
						// The copied branches are orphaned from the larger hierarchy, and must be
						// updated separately (see note at L152).
						d.treemapRoot.sum(sum)
						d.treemapRoot.children.forEach(function (d) {
						d.sort(function (a, b) { return b.value - a.value })
					})
				})

				types = types.enter().append('g')
					.attr('class', 'type')
					.attr('transform', function (d) {
						return 'translate(' + x1(d.data.type) + ',' + height + ')'
					})
					.each(function (d) {
						// ENTER
						// Note that we can use .each on selections as a way to perform operations
						// at a given depth of the hierarchy tree.
						d.children.sort(function (a, b) {
							return orderedDescriptors.indexOf(b.data.descriptor) -
							orderedDescriptors.indexOf(a.data.descriptor)
						})
						d.children.forEach(function (d) {
							d.sort(function (a, b) { return b.value - a.value })
						})
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
					.delay(function (d, i) { return d.parent.index * 150 + i * 50 })
					.attr('transform', function (d) {
						return 'translate(' + x1(d.data.type) + ',' + (height - y(d.value)) + ')'
				})

				var descriptors = types.selectAll('.descriptor')
					// Note that we're using our copied branch.
					.data(function (d) { return d.treemapRoot.children },
					function (d) { return d.data.descriptor })

				descriptors = descriptors.enter().append('g')
					.attr('class', 'descriptor')
					.merge(descriptors)

				var items = descriptors.selectAll('.item')
					.data(function (d) { return d.children },
						function (d) { return d.data.item })

				var enterItems = items.enter().append('rect')
					.attr('class', 'item')
					.attr('x', function (d) { return d.x0 })
					.attr('width', function (d) { return d.x1 - d.x0 })
					.attr('y', function (e) { return e.y0 })
					.attr('height', function (d) { return d.y1 - d.y0 })
					.style('fill', function (d) { return color(d.parent.data.descriptor) })


				items = items.merge(enterItems)

				enterItems
					.on('mouseover', function (d) {
						svg.classed('hover-active', true)   							
						items.classed('hover', function (e) {
							tooltip.html('<div>' + d.data.item +"(" + d3.format(".0%")(d.data.value) + ")"+ '</div>');
							tooltip.show();						
							return e.data.item === d.data.item
						})

					})
					.on('mouseout', function () {                
						svg.classed('hover-active', false)
						items.classed('hover', false)
						tooltip.hide();						
					})
					.on('click', function (d) {
						options.item = options.item === d.data.item ? null : d.data.item                              
						update()
					})              
					// .append('title')
					// .text(function (d) { return d.data.item })

				items.filter(function (d) { return d.data.item === options.item })
					.each(function (d) { console.log(d); d3.select(this.parentNode).raise() })
					.raise()
				items
					.transition(t)
					.attr('x', function (d) { return d.value ? d.x0 : x1.bandwidth() / 2 })
					.attr('width', function (d) { return d.value ? d.x1 - d.x0 : 0 })
					.attr('y', function (d) { return d.value ? d.y0 : d.parent.parent.y1 / 2 })
					.attr('height', function (d) { return d.value ? d.y1 - d.y0 : 0 })

			}
		}
		  

		return (
				<div className={styles.DetailView}>
					<div className={index.title}>
						Content
						<Tooltip title="Pattern narrative as word clouds">
							<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
						</Tooltip>																							
					</div>
				  <div id="content">
				  
				  </div>					
				</div>
		);

	}
}

export default TreeMapView;
