import React, { Component } from 'react';
import * as d3 from 'd3';


export function extractItemCoordinates(q_bar_start, items){

	const arcStart = q_bar_start.split('M').join(',').split('A').join(',').split('L').join(',').split(' ').join(',').split(','),
		arcStart_start = arcStart.slice(10,12),
		arcStart_end = arcStart.slice(17,19);

	return d3.range(items.length).map(function(i) {
			// get the flower coordinates and rotation degree
			const   translate_g_flower = items[i].transform_g_flower.replace('translate(','').replace(')','').split(','),
					translate_bar = items[i].transform_bar.replace('translate(','').replace(')','').split(','),				
			// root of the bar
					arcEnd = items[i].q_bar_end.split('M').join(',').split('A').join(',').split('L').join(',').split(' ').join(',').split(','),
					arcEnd_start = arcEnd.slice(10,12),
					arcEnd_end = arcEnd.slice(17,19),
					start_x = (parseFloat(arcStart_start[0]) + parseFloat(arcStart_end[0]))/2,
					start_y = (parseFloat(arcStart_start[1]) + parseFloat(arcStart_end[1]))/2,
					end_x = (parseFloat(arcEnd_start[0]) + parseFloat(arcEnd_end[0]))/2,
					end_y = (parseFloat(arcEnd_start[1]) + parseFloat(arcEnd_end[1]))/2;
			return {

				start: [parseFloat(translate_bar[0])+start_x-parseFloat(translate_g_flower[0]), parseFloat(translate_bar[1])+start_y-parseFloat(translate_g_flower[1])],
				end: [parseFloat(translate_bar[0])+end_x-parseFloat(translate_g_flower[0]), parseFloat(translate_bar[1])+end_y-parseFloat(translate_g_flower[1])],
				control: [parseFloat(translate_bar[0])+start_x/2. + end_x/2.-parseFloat(translate_g_flower[0]), 
							parseFloat(translate_bar[1])+end_x/2. + end_y/2.-parseFloat(translate_g_flower[1])],
				similarity: items[i].similarity
			};
		});
}

export function extractPetalBarCoordinates(petals_path_items){
	return d3.range(petals_path_items.length).map(function(i) {
			// get the flower coordinates and rotation degree
			const translate_flower = petals_path_items[i].translate_flower.replace('translate(','').replace(')','').split(','),
					translate_g_flower = petals_path_items[i].transform_g_flower.replace('translate(','').replace(')','').split(','),
					translate_bar = petals_path_items[i].transform_bar.replace('translate(','').replace(')','').split(','),
					translate_petal = petals_path_items[i].transform_petal.replace('rotate(','').replace(')','').split(',');
			// tip of the petal
			const	arcEnd_bar = petals_path_items[i].d_bar.split('M').join(',').split('A').join(',').split('L').join(',').split(' ').join(',').split(','),
					arcEnd_bar_start = arcEnd_bar.slice(10,12),
					arcEnd_bar_end = arcEnd_bar.slice(17,19);

			return {
				degree: parseFloat(translate_petal),
				coordinates:[
					{
						x: parseFloat(translate_flower[0]), 
						y: parseFloat(translate_flower[1])
					}, 
					{
						x: parseFloat(translate_bar[0])+((parseFloat(arcEnd_bar_start[0]) + parseFloat(arcEnd_bar_end[0]))/2)-parseFloat(translate_g_flower[0]),
						y: parseFloat(translate_bar[1])+((parseFloat(arcEnd_bar_start[1]) + parseFloat(arcEnd_bar_end[1]))/2)-parseFloat(translate_g_flower[1])
					}
				]
			};
		});
}