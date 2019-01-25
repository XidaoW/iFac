import React, { Component } from 'react';
import * as d3 from 'd3';


// adpated from https://bl.ocks.org/pbeshai/72c446033a98f99ce1e1371c6eee9644


export function quadraticPath(t){
	return "M"+t.start[0]+","+t.start[1]+" Q"+t.control[0]+","+t.control[1]+" "+t.end[0]+","+t.end[1];
}


// B(t) = (1 - t)^2P0 + 2(1 - t)tP1 + t^2P2
export function interpolateQuadraticBezier(start, control, end) {
	// 0 <= t <= 1
	return function interpolator(t) {
		return [
				(Math.pow(1 - t, 2) * start[0]) +
				(2 * (1 - t) * t * control[0]) +
				(Math.pow(t, 2) * end[0]),
				(Math.pow(1 - t, 2) * start[1]) +
				(2 * (1 - t) * t * control[1]) +
				(Math.pow(t, 2) * end[1]),
				];
	};
}

// B'(t) = 2(1 - t)(P1 - P0) + 2t(P2 - P1)
export function interpolateQuadraticBezierAngle(start, control, end) {
	// 0 <= t <= 1
	return function interpolator(t) {
		const tangentX = (2 * (1 - t) * (control[0] - start[0])) +
										 (2 * t * (end[0] - control[0]));
		const tangentY = (2 * (1 - t) * (control[1] - start[1])) +
										 (2 * t * (end[1] - control[1]));

		return Math.atan2(tangentY, tangentX) * (180 / Math.PI);
	}
}

// draw a quadratic bezier curve
export function drawQuadratic(g, quadratic, stroke_color, line_opacity) {
	const gQuadratic = g.append('g')
		.attr('class', 'quadratic');

	// draw the points
	gQuadratic.append('circle')
		.attr('r', 5)
		.attr('class', 'start-point')
		.attr('cx', quadratic.start[0])
		.attr('cy', quadratic.start[1])
		.attr("fill", "#fff")
		.attr("stroke", stroke_color);

	gQuadratic.append('circle')
		.attr('r', 0.5)
		.attr('class', 'end-point')
		.attr('cx', quadratic.end[0])
		.attr('cy', quadratic.end[1])
		.attr("fill", "#fff")
		.attr("stroke", stroke_color);

	// draw the path
	var cur_path = gQuadratic.append('path')
		.attr('class', 'curve')
		.attr('d', quadraticPath(quadratic))
		.attr("fill", "none")
		.attr("stroke-width", "2px")
		// .attr("stroke-width", line_width(quadratic.similarity));
		.attr("stroke-opacity", line_opacity(quadratic.similarity))
		.attr("stroke", stroke_color);
		


	// draw transition
	// console.log(cur_path.node().getTotalLength());
    // var totalLength = cur_path.node().getTotalLength();

    // cur_path
    //   .attr("stroke-dasharray", totalLength + " " + totalLength)
    //   .attr("stroke-dashoffset", totalLength)
    //   .transition()
    //     .duration(2000)
    //     .ease("linear")
    //     .attr("stroke-dashoffset", 0);

	const quadraticInterpolator = interpolateQuadraticBezier(quadratic.start, quadratic.control, quadratic.end);
	const interpolatedPoints = d3.range(10).map((d, i, a) => quadraticInterpolator(d / (a.length - 1)));

	gQuadratic.selectAll('.interpolated-point').data(interpolatedPoints)
		.enter()
			.append('circle')
				.attr('class', 'interpolated-point')
				.attr('r', 0.3)
				.attr('cx', d => d[0])
				.attr('cy', d => d[1])
				.attr("fill", "#077");



	const quadraticAngleInterpolator = interpolateQuadraticBezierAngle(quadratic.start, quadratic.control, quadratic.end);

	// const rotatedPoints = d3.range(3).map((d, i, a) => {
	// 	const t = d / (a.length - 1);
	// 	return {
	// 		t: t,
	// 		position: quadraticInterpolator(t),
	// 		angle: quadraticAngleInterpolator(t),
	// 	};
	// });

	// gQuadratic.selectAll('.rotated-point').data(rotatedPoints)
	// 	.enter()
	// 		.append('path')
	// 			.attr('d', 'M12,0 L-5,-8 L0,0 L-5,8 Z')
	// 			.attr('class', 'rotated-point')
	// 			.attr('transform', d => `translate(${d.position[0]}, ${d.position[1]}) rotate(${d.angle})`)
	// 			.attr("fill", "#af84e6")
	// 			.attr("stroke", "#660cd0");
	return gQuadratic;
}
