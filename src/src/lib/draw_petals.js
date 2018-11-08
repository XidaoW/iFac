import React, { Component } from 'react';
import * as d3 from 'd3';

export function petalPath(d, outerCircleRadius) {		  
	var size_petal_radius = d3.scalePow().domain([0, 1]).range([0, outerCircleRadius]);		
	var size_petal_arc = d3.scaleLinear().domain([0, 1]).range([0, 2 * Math.PI * outerCircleRadius / 3]);
	var size_petal_curve = d3.scaleSqrt().domain([0, 1]).range([0, outerCircleRadius]);		
	// s -> start position of the petal
	// e -> end position of the petal
	// s - e defines the root length of the petal => controlled by similarity
	// c defines the root curve of the petal => controlled by similarity
	// r -> petal length => controlled by entropy
	var angle = (d.endAngle - d.startAngle) / 2,
		s = polarToCartesian(-angle, size_petal_arc(d.data.width), outerCircleRadius),
		e = polarToCartesian(angle, size_petal_arc(d.data.width), outerCircleRadius),
		c = polarToCartesian(0, size_petal_arc(d.data.width), outerCircleRadius),
		r = size_petal_radius(d.data.length),
		m = petalRadius(r, outerCircleRadius),
		c1 = {x: outerCircleRadius + r / 2, y: s.y},
		c2 = {x: outerCircleRadius + r / 2, y: e.y};

	// s - e defines the root length of the petal => controlled by centropy
	// c defines the root curve of the petal => controlled by centropy
	// r -> petal length => controlled by similarity

	var angle = (d.endAngle - d.startAngle) / 2,
		s = polarToCartesian(-angle, size_petal_arc(d.data.length), outerCircleRadius),
		e = polarToCartesian(angle, size_petal_arc(d.data.length), outerCircleRadius),
		c = polarToCartesian(0, size_petal_arc(d.data.length), outerCircleRadius),
		r = size_petal_radius(d.data.width),
		m = petalRadius(r, outerCircleRadius),
		c1 = {x: outerCircleRadius + r / 2, y: s.y},
		c2 = {x: outerCircleRadius + r / 2, y: e.y};


	// s - e defines the root length of the petal => default size
	// c defines the root curve of the petal => default size
	// r -> petal length => controlled by similarity
	// c1, c2 curve shape = controlled by entropy

	var angle = (d.endAngle - d.startAngle) / 2,
		s = polarToCartesian(-angle, size_petal_arc(0.8), outerCircleRadius),
		e = polarToCartesian(angle, size_petal_arc(0.8), outerCircleRadius),
		c = polarToCartesian(0, size_petal_arc(0.9), outerCircleRadius),
		r = size_petal_radius(d.data.width),
		m = petalRadius(r, outerCircleRadius),
		c1 = {x: outerCircleRadius + r / 2, y: s.y + size_petal_curve(d.data.length)},
		c2 = {x: outerCircleRadius + r / 2, y: e.y - size_petal_curve(d.data.length)};

	return "M" + s.x + "," + s.y + "Q" + c1.x + "," + c1.y + " " + m.x + "," + m.y +
	"Q" + c2.x + "," + c2.y + " " + e.x + "," + e.y + "Q" + c.x + "," +  c.y +" " + s.x + "," + s.y + "Z";

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

export function polarToCartesian(angle, arc_length, outerCircleRadius) {
	
	var angle_arc = arc_length / (2 * Math.PI * outerCircleRadius / 3) * angle
	return {
		// start and end of the petal
		// size of the petal
		x: Math.cos(angle_arc) * outerCircleRadius,
		y: Math.sin(angle_arc) * outerCircleRadius
	};
};

export function petalFill(d, i, petals) {
  return d3.hcl(i / petals * 360, 60, 70);
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
