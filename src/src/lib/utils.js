import React, { Component } from 'react';
import * as d3 from 'd3';


export function computeDescriptorRange(descriptor_index, descriptor_size,descriptor_size_list, shift_size){
	var total_size = 2*Math.PI/descriptor_size,
		max_item_cnt = d3.max(descriptor_size_list),
		each_value = total_size*1. / max_item_cnt,
		total_value_current = each_value * descriptor_size_list[descriptor_index],
		start_value = 2*Math.PI*(descriptor_index+1)/descriptor_size + shift_size + (total_size - total_value_current) / 2.0,
		end_value = 2*Math.PI*(descriptor_index+2)/descriptor_size - (total_size - total_value_current) / 2.0;
	return [start_value,  end_value];	
}  

export function barFill(d, descriptor_index, descriptor_size, bar_opacity, components_cnt) {
	if(d.id >= components_cnt){
		return axisStroke(descriptor_index, descriptor_size);
	}  
	let cur_color  = d3.select('#pattern_' + d.id).attr('stroke'),       
		color_dark = d3.rgb(cur_color).darker(0.5),
		color_light = d3.rgb(cur_color).brighter(0.5),
		color_pick = d3.scaleLinear().domain([0, 1]).range([color_light,color_dark]);

	return cur_color;
	// return color_pick(bar_opacity(d.value));
}
export function barFillOpacity(d, descriptor_index, descriptor_size, foregroundBarOpacity, backgroundBarOpacity,bar_opacity, components_cnt, barFillOpacityConst) {
	return (d.id >= components_cnt)? barFillOpacityConst : 1;
};