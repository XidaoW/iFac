import React, { Component } from 'react';
import * as d3 from 'd3';
import * as cloud from 'd3-cloud';
import ReactFauxDOM from 'react-faux-dom';

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)
import { Tooltip, Icon } from 'antd';


class TreeMapView extends Component {
	
	constructor(props) {
		super(props);

		this.layout = {
			width: 250,
			height: 1000,
			svg: {
				width: 250, // 90% of whole layout
				height: 1000 // 100% of whole layout
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
		const data = require("../../data/imports.json");
		var margin = { top: 15, right: 15, bottom: 40, left: 60 }
		var width = 250 - margin.left - margin.right
		var height = 1000 - margin.top - margin.bottom

		var orderedContinents = ['Asia', 'North America', 'Europe', 'South America', 'Africa', 'Australia']
		var color = d3.scaleOrdinal()
		    .domain(orderedContinents)
		    .range(['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f'])

		var dollarFormat = d3.format('$,')
		var tickFormat = function (n) {
		    return n === 0 ? '$0'
		        : n < 1000000 ? dollarFormat(n / 1000) + ' billion'
		            : dollarFormat(n / 1000000) + ' trillion'
		}

		var options = {
		    key: 'value',
		    country: null
		}
		initialize(data);

		function initialize(data) {

		    var root = d3.hierarchy(data).sum(function (d) { return d['value'] })
		 var root = d3.hierarchy(data)

    root.children.sort(function (a, b) { return a.data.year - b.data.year })

    var g = d3.select(svg)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    var x0 = d3.scaleBand()
        .range([0, width])
        .padding(0.15)

    var x1 = d3.scaleBand()
        .domain(['Imports', 'Exports'])
        .paddingInner(0.1)

    var y = d3.scaleLinear()
        .range([0, height])

    var x0Axis = d3.axisBottom()
        .scale(x0)
        .tickSize(0)

    var x1Axis = d3.axisBottom()
        .scale(x1)

    var yAxis = d3.axisLeft()
        .tickSize(-width)
        .tickFormat(tickFormat)

    var gx0 = g.append('g')
        .attr('class', 'x0 axis')
        .attr('transform', 'translate(0,' + (height + 22) + ')')

    var gy = g.append('g')
        .attr('class', 'y axis')


    update('value')

    function update(key) {
        root.sum(function (d) { return d[key] })

        var yearData = root.children
        var typeData = d3.merge(yearData.map(function (d) { return d.children }))

        x0.domain(yearData.map(function (d) { return d.data.year }).sort())
        x1.rangeRound([0, x0.bandwidth()])
        y.domain([0, d3.max(typeData.map(function (d) { return d.value }))]).nice()

        // We use a copied Y scale to invert the range for display purposes
        yAxis.scale(y.copy().range([height, 0]))

        gx0.call(x0Axis)
        gy.call(yAxis)

        var t = d3.transition()

        var years = g.selectAll('.year')
            .data(root.children, function (d) { return d.data.year })

        var enterYears = years.enter().append('g')
            .attr('class', 'year')

        enterYears.append('g')
            .attr('class', 'x1 axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(x1Axis)

        years = years.merge(enterYears)
            .attr('transform', function (d) {
                return 'translate(' + x0(d.data.year) + ',0)'
            })

        var types = years.selectAll('.type')
            .data(function (d) { return d.children },
                  function (d) { return d.data.type })
            .each(function (d) {
                // UPDATE
                // The copied branches are orphaned from the larger hierarchy, and must be
                // updated separately (see note at L152).
                d.treemapRoot.sum(function (d) { return d[key] })
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
                    return orderedContinents.indexOf(b.data.continent) -
                        orderedContinents.indexOf(a.data.continent)
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

        types.transition(t)
            .delay(function (d, i) { return d.parent.index * 150 + i * 50 })
            .attr('transform', function (d) {
                return 'translate(' + x1(d.data.type) + ',' + (height - y(d.value)) + ')'
            })

        var continents = types.selectAll('.continent')
            // Note that we're using our copied branch.
            .data(function (d) { return d.treemapRoot.children },
                  function (d) { return d.data.continent })

        continents = continents.enter().append('g')
            .attr('class', 'continent')
            .merge(continents)

        var countries = continents.selectAll('.country')
            .data(function (d) { return d.children },
                  function (d) { return d.data.country })

        var enterCountries = countries.enter().append('rect')
            .attr('class', 'country')
            .attr('x', function (d) { return d.x0 })
            .attr('width', function (d) { return d.x1 - d.x0 })
            .attr('y', 0)
            .attr('height', 0)
            .style('fill', function (d) { return color(d.parent.data.continent) })

        countries = countries.merge(enterCountries)

        enterCountries
            .on('mouseover', function (d) {
                g.classed('hover-active', true)
                countries.classed('hover', function (e) {
                    return e.data.country === d.data.country
                })
            })
            .on('mouseout', function () {
                g.classed('hover-active', false)
                countries.classed('hover', false)
            })
            .append('title')
            .text(function (d) { return d.data.country })

            console.log(countries);
        countries.filter(function (d) { return d.data.country === options.country })
            .each(function (d) { d3.select(this.parentNode).raise() })
            .raise()

        countries
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
					{svg.toReact()}
				</div>
		);

	}
}

export default TreeMapView;
