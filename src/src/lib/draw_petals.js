import React, { Component } from 'react';
import * as d3 from 'd3';

export function petalPath(d, outerCircleRadius, descriptor_size) {	
	  
	var size_petal_radius = d3.scalePow().domain([0, 1]).range([0, outerCircleRadius]);		
	var size_petal_arc = d3.scaleLinear().domain([0, 1]).range([0, 2 * Math.PI * outerCircleRadius / descriptor_size]);
	var size_petal_curve = d3.scaleSqrt().domain([0, 1]).range([0, outerCircleRadius]);		
	// s -> start position of the petal
	// e -> end position of the petal
	// s - e defines the root length of the petal => controlled by similarity
	// c defines the root curve of the petal => controlled by similarity
	// r -> petal length => controlled by entropy
	var angle = (d.endAngle - d.startAngle) / 2,
		s = polarToCartesian(-angle, size_petal_arc(d.data.width), outerCircleRadius, descriptor_size),
		e = polarToCartesian(angle, size_petal_arc(d.data.width), outerCircleRadius, descriptor_size),
		c = polarToCartesian(0, size_petal_arc(d.data.width), outerCircleRadius, descriptor_size),
		r = size_petal_radius(d.data.length),
		m = petalRadius(r, outerCircleRadius),
		c1 = {x: outerCircleRadius + r / 2, y: s.y},
		c2 = {x: outerCircleRadius + r / 2, y: e.y};

	// s - e defines the root length of the petal => controlled by centropy
	// c defines the root curve of the petal => controlled by centropy
	// r -> petal length => controlled by similarity

	var angle = (d.endAngle - d.startAngle) / 2,
		s = polarToCartesian(-angle, size_petal_arc(d.data.length), outerCircleRadius, descriptor_size),
		e = polarToCartesian(angle, size_petal_arc(d.data.length), outerCircleRadius, descriptor_size),
		c = polarToCartesian(0, size_petal_arc(d.data.length), outerCircleRadius, descriptor_size),
		r = size_petal_radius(d.data.width),
		m = petalRadius(r, outerCircleRadius),
		c1 = {x: outerCircleRadius + r / 2, y: s.y},
		c2 = {x: outerCircleRadius + r / 2, y: e.y};


	// s - e defines the root length of the petal => default size
	// c defines the root curve of the petal => default size
	// r -> petal length => controlled by similarity
	// c1, c2 curve shape = controlled by entropy

	var angle = (d.endAngle - d.startAngle) / 2,
		s = polarToCartesian(-angle, size_petal_arc(0.8), outerCircleRadius, descriptor_size),
		e = polarToCartesian(angle, size_petal_arc(0.8), outerCircleRadius, descriptor_size),
		c = polarToCartesian(0, size_petal_arc(0.9), outerCircleRadius, descriptor_size),
		r = size_petal_radius(d.data.width),
		m = petalRadius(r, outerCircleRadius),
		c1 = {x: outerCircleRadius + r / 2, y: s.y + size_petal_curve(d.data.length)},
		c2 = {x: outerCircleRadius + r / 2, y: e.y - size_petal_curve(d.data.length)};

	return "M" + s.x + "," + s.y + "Q" + c1.x + "," + c1.y + " " + m.x + "," + m.y +
	"Q" + c2.x + "," + c2.y + " " + e.x + "," + e.y + "Q" + c.x + "," +  c.y +" " + s.x + "," + s.y + "Z";

};


export function petalStartPosition(d, outerCircleRadius, descriptor_size) {	
	  
	var size_petal_radius = d3.scalePow().domain([0, 1]).range([0, outerCircleRadius]);		
	var size_petal_arc = d3.scaleLinear().domain([0, 1]).range([0, 2 * Math.PI * outerCircleRadius / descriptor_size]);
	var size_petal_curve = d3.scaleSqrt().domain([0, 1]).range([0, outerCircleRadius]);		
	// s -> start position of the petal
	// e -> end position of the petal
	// s - e defines the root length of the petal => controlled by similarity
	// c defines the root curve of the petal => controlled by similarity
	// r -> petal length => controlled by entropy
var angle = (d.endAngle - d.startAngle) / 2,
		s = polarToCartesian(-angle, size_petal_arc(d.data.width), outerCircleRadius, descriptor_size),
		e = polarToCartesian(angle, size_petal_arc(d.data.width), outerCircleRadius, descriptor_size),
		c = polarToCartesian(0, size_petal_arc(d.data.width), outerCircleRadius, descriptor_size),
		r = size_petal_radius(d.data.length),
		m = petalRadius(r, outerCircleRadius),
		c1 = {x: outerCircleRadius + r / 2, y: s.y},
		c2 = {x: outerCircleRadius + r / 2, y: e.y};

	// s - e defines the root length of the petal => controlled by centropy
	// c defines the root curve of the petal => controlled by centropy
	// r -> petal length => controlled by similarity

	var angle = (d.endAngle - d.startAngle) / 2,
		s = polarToCartesian(-angle, size_petal_arc(d.data.length), outerCircleRadius, descriptor_size),
		e = polarToCartesian(angle, size_petal_arc(d.data.length), outerCircleRadius, descriptor_size),
		c = polarToCartesian(0, size_petal_arc(d.data.length), outerCircleRadius, descriptor_size),
		r = size_petal_radius(d.data.width),
		m = petalRadius(r, outerCircleRadius),
		c1 = {x: outerCircleRadius + r / 2, y: s.y},
		c2 = {x: outerCircleRadius + r / 2, y: e.y};


	// s - e defines the root length of the petal => default size
	// c defines the root curve of the petal => default size
	// r -> petal length => controlled by similarity
	// c1, c2 curve shape = controlled by entropy

	var angle = (d.endAngle - d.startAngle) / 2,
		s = polarToCartesian(-angle, size_petal_arc(0.8), outerCircleRadius, descriptor_size),
		e = polarToCartesian(angle, size_petal_arc(0.8), outerCircleRadius, descriptor_size),
		c = polarToCartesian(0, size_petal_arc(0.9), outerCircleRadius, descriptor_size),
		r = size_petal_radius(d.data.width),
		m = petalRadius(r, outerCircleRadius),
		c1 = {x: outerCircleRadius + r / 2, y: s.y + size_petal_curve(d.data.length)},
		c2 = {x: outerCircleRadius + r / 2, y: e.y - size_petal_curve(d.data.length)};

	return 'translate(' +c2.x + ',' 
									+ c2.y + ')';
};

export function petalRadius(r, outerCircleRadius){
	return {
		x: outerCircleRadius + r, 
		y: 0
	}
}

export function flowerSum(d) {
  return d3.sum(d.petals, function(d) { return d.length; });
}


export function rotateAngle(angle) {
  return "rotate(" + (angle / Math.PI * 180 ) + ")";
}

export function polarToCartesian(angle, arc_length, outerCircleRadius, descriptor_size) {
	
	var angle_arc = arc_length / (2 * Math.PI * outerCircleRadius / descriptor_size) * angle
	return {
		// start and end of the petal
		// size of the petal
		x: Math.cos(angle) * outerCircleRadius,
		y: Math.sin(angle) * outerCircleRadius
	};
};

export function petalFill(d, i, petals) {
	var color_list = ["#85D4E3", "#F4B5BD", "#9C964A", "#CDC08C", "#FAD77B"]
	return color_list[i];
	// return d3.hcl(i / petals * 360, 60, 70);
};


export function circleStrokeFill(i, patternsCnt) {
  return d3.hcl(i / patternsCnt * 360, 20, 70);
};		

export function circleStrokeFillLimited(i, patternsCnt) {
	console.log(patternsCnt);
	var color_list = ["#ffff99", "#fdc086", "#beaed4"];
  return d3.hcl(i / patternsCnt * 360, 20, 70);
};		


export function petalStroke(d, i,petals) {
  return d3.hcl(i / petals * 360, 60, 70);
};


// export petalStroke = arg => fetch(arg);
