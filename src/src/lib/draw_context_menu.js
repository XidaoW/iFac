import React, { Component } from 'react';
import * as d3 from 'd3';

	function contextMenu() {
		var height = 60,
			width = 60, 
			margin = 0.1, // fraction of width
			items = [], 
			rescale = false, 
			style = {
				'rect': {
					'mouseout': {
						'fill': 'rgb(244,244,244)', 
						'stroke': 'white', 
						'stroke-width': '1px'
					}, 
					'mouseover': {
						'fill': 'rgb(200,200,200)'
					}
				}, 
				'text': {
					'fill': 'steelblue', 
					'font-size': '13'
				}
			}; 
		
		function menu(x, y) {
			d3.select('.context-menu').remove();
			scaleItems();
			height = 60,
			width = 60, 
			margin = 0.1; // fraction of width
			// Draw the menu
			d3.select('svg')
				.append('g')
				.attr('class', 'context-menu')
				.selectAll('tmp')
				.data(items).enter()
				.append('g')
				.attr('class', 'menu-entry')					
				.on('mouseover', function(){ 
					d3.select(this).select('rect').style(style.rect.mouseover) })
				.on('mouseout', function(){ 
					d3.select(this).select('rect').style(style.rect.mouseout) })
				.style('cursor', 'pointer');
			
			d3.selectAll('.menu-entry')
				.append('rect')
				.attr('x', x)
				.attr('y', function(d, i){ return y + (i * height); })
				.attr('width', width)
				.attr('height', height)
				.style(style.rect.mouseout);
			
			d3.selectAll('.menu-entry')
				.append('text')
				.text(function(d){ return d; })
				.attr('x', x)
				.attr('y', function(d, i){ 
					return y + (i * height); })
				.attr('dy', height - margin / 2)
				.attr('dx', margin)
				.style(style.text);

			// Other interactions
			d3.select('body')
				.on('click', function() {
					d3.select('.context-menu').remove();
				});

		}
		
		menu.items = function(e) {
			if (!arguments.length) return items;
			for (i in arguments) items.push(arguments[i]);
			rescale = true;
			return menu;
		}

		// Automatically set width, height, and margin;
		function scaleItems() {
			if (rescale) {
				d3.select('svg').selectAll('tmp')
					.data(items).enter()
					.append('text')
					.attr('class', 'tmp')
					.attr('x', -1000)
					.attr('y', -1000)						
					.text(function(d){ return d; })
					.style(style.text);

				console.log(d3.select('svg').selectAll('.tmp'));
				var z = d3.selectAll('.tmp')
						  .each(function(x){ return this.getBBox(); });
				width = d3.max(z.each(function(x){ return x.width; }));
				margin = margin * width;
				width =  width + 2 * margin;
				height = d3.max(z.each(function(x){ return x.height + margin / 2; }));
				
				// cleanup
				d3.selectAll('.tmp').remove();
				rescale = false;
			}
		}

		return menu;
	}
var mainw = 960,
mainh = 500;

d3.select('body').append('svg').attr('id', 'svg-main')
.attr('width', mainw)
.attr('height', mainh);

var menu = contextMenu().items('first item', 'second option', 'whatever, man');

d3.select('svg').append('rect')
.attr('x', mainw/2 - 30)
.attr('y', mainh/2 - 30)
.attr('width', 60)
.attr('height', 60)
.on('contextmenu', function(){ 
    d3.event.preventDefault();
    menu(d3.mouse(this)[0], d3.mouse(this)[1]);
});
