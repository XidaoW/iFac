import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import d3tooltip from 'd3-tooltip';
import {scaleRadial} from '../../lib/draw_radial.js';
import * as quadPath from '../../lib/draw_quadratic_path.js';
import * as petal from '../../lib/draw_petals.js';
import PatternGlyph from 'components/PatternGlyph';

import _ from 'lodash';
import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)
import Circos, { SCATTER } from 'react-circos';
import { Spin, Switch, message, Modal, Tag, Input, Tooltip, Icon, Button, Radio } from 'antd';
import QueryPanel from 'components/QueryPanel';
import scrollIntoView from 'scroll-into-view';

const tooltip = d3tooltip(d3);


class CircularView extends Component {
  
	constructor(props) {
		super(props);
		this.layout = {
			svg: {
				width: 450,
				height: 450
			},
			detailView: {
				margin: {
					top: gs.detailViewMarginTop,
					bottom: gs.detailViewMarginBottom,
					left: gs.detailViewMarginLeft,
					right: gs.detailViewMarginRight
				}
			},
		};

		this.pie;	
		this.circle_position_x;
		this.circle_position_y;
		this.svg;
		this.circle_color;
		this.circle_width;
		this.query_flag;
		this.compare_N = 2;
		this.editable_flag = false;
		this.color_list_petal = props.color_list_petal;
		this.outerCircleRadius = parseInt(gs.outerCircleRadius);
		this.innerCircleRadius = parseInt(gs.innerCircleRadius);
		this.innerCircleStrokeWidth = parseInt(gs.innerCircleStrokeWidth);
		this.innerCircleStrokeOpacity = parseInt(gs.innerCircleStrokeOpacity);
		this.outerCircleStrokeWidth = parseInt(gs.outerCircleStrokeWidth);
		this.outerCircleStrokeOpacity = parseInt(gs.outerCircleStrokeOpacity);

		this.detailViewMarginTop = gs.detailViewMarginTop;
		this.detailViewMarginBottom = gs.detailViewMarginBottom;
		this.detailViewMarginLeft = gs.detailViewMarginLeft;
		this.detailViewMarginRight = gs.detailViewMarginRight;
		this.backgroundBarOpacity = gs.detailViewBKBarOpacity;
		this.foregroundBarOpacity = gs.detailViewFGBarOpacity;
		this.circularInnerRadius = gs.circularInnerRadius;
		this.barLabelFontSize = gs.barLabelFontSize;
		this.handleResetPatterns = this.handleResetPatterns.bind(this);				
		this.handleResetItems = this.handleResetItems.bind(this);		
		this.handleDeletePattern = this.handleDeletePattern.bind(this);						
		this.handleMergePattern = this.handleMergePattern.bind(this);						
		this.handleUpdatePattern = this.handleUpdatePattern.bind(this);		
		this.handleChangeProjection = this.handleChangeProjection.bind(this);		
		this.handleMoveItemPosition = this.handleMoveItemPosition.bind(this);		
		this.renderRadioButton = this.renderRadioButton.bind(this);		
		this.renderUpdateButton = this.renderUpdateButton.bind(this);	
		this.renderSpinGlyph = this.renderSpinGlyph.bind(this);	
		this.renderGlyph = this.renderGlyph.bind(this);		
		this.renderSingleGlyph = this.renderSingleGlyph.bind(this);								
		this.showButton = this.showButton.bind(this);	
		this.handleSwithEdit = this.handleSwithEdit.bind(this);									

	}

	showButton(btn_index){
		if(btn_index === 1){
			// delete button / reset pattern selection
			return (this.props.selectedPatterns.length > 0) ? false:true;
		}else if(btn_index === 2){
			// merge button
			return (this.props.selectedPatterns.length > 1) ? false:true;
		}else if(btn_index === 3){
			// update model button
			return (this.props.deletedPatternIdx.length > 0 || this.props.updateItemPostionsFlag ) ? false:true;
		}else if(btn_index === 4){
			//reset item selection
			return (this.query_flag) ? false:true;
		}					
	
	}


	handleSwithEdit(checked){
		this.props.onSwitchEdit(checked);
	}

	handleResetPatterns() {
		d3.selectAll('.pattern_circles').attr('stroke-opacity', 0.3);
		d3.selectAll('.pattern_circles_mini').attr('stroke-opacity', 0.3);
		d3.selectAll('.pattern_circles').attr('stroke', 'grey');
		d3.selectAll('.pattern_circles_mini').attr('stroke', 'grey');

		this.props.onResetPatterns();
	}
	handleResetItems() {
		d3.selectAll('.query_bar').classed('queried', false)	
		d3.selectAll('.query_bar').attr("stroke", "none");
		d3.selectAll('.itemTags').remove()
		this.props.onResetItems();		
	}

	handleDeletePattern(deletedPatternsIdx) {
		var t = d3.transition()
			.duration(1000)
			.delay(100)
			.ease(d3.easeBounce);

		deletedPatternsIdx.map((idx) => {
			d3.select('.pattern_circles#pattern_' + idx).transition(t).style("display", "none");
			d3.select('.flower#flower_' + idx).transition(t).style("display", "none");
			d3.select('tr.pattern_row_' + idx).transition(t).style("display", "none");
		});
		d3.selectAll('.pattern_circles').attr('stroke', 'grey');                                      
		d3.selectAll('.pattern_circles').attr('stroke-opacity', 0.3);
		d3.selectAll('.pattern_circles_mini').attr('stroke', 'grey');
		d3.selectAll('.pattern_circles_mini').attr('stroke-opacity', 0.3);		

		this.props.onDeletePatterns(deletedPatternsIdx);
	}

	handleMoveItemPosition(item_index, descriptor_index, positios) {
		this.props.onUpdateItemPositions(item_index, descriptor_index, positios);
	}	

	handleUpdatePattern() {
		this.props.onUpdatePatterns();
		d3.selectAll('.pattern_circles').attr('stroke', 'grey');                                      
		d3.selectAll('.pattern_circles').attr('stroke-opacity', 0.3);
		d3.selectAll('.pattern_circles_mini').attr('stroke', 'grey');
		d3.selectAll('.pattern_circles_mini').attr('stroke-opacity', 0.3);
	}

	handleMergePattern(mergePatternIdx) {
		var t = d3.transition()
			.duration(1000)
			.delay(100)
			.ease(d3.easeBounce);

		d3.selectAll('.pattern_circles').attr('stroke', 'grey');                                      
		d3.selectAll('.pattern_circles').attr('stroke-opacity', 0.3);
		d3.selectAll('.pattern_circles_mini').attr('stroke', 'grey');
		d3.selectAll('.pattern_circles_mini').attr('stroke-opacity', 0.3);		
		[mergePatternIdx[1]].map((idx) => {
			d3.select('.pattern_circles#pattern_' + idx).transition(t).style("display", "none");
			d3.select('.flower#flower_' + idx).transition(t).style("display", "none");
			d3.select('tr.pattern_row_' + idx).transition(t).style("display", "none");
		});		
		this.props.onMergePatterns();
	}	

	handleChangeProjection(e) {
		this.props.onChangeProjection(e.target.value);
	}	

	renderGlyph(selectedIdxs){
		return selectedIdxs.map((idx) => <PatternGlyph 
					idx={idx}
					color_list_petal={this.color_list_petal}
					data={this.props.data}
				/>
			)
	}

	renderSingleGlyph(weight){
		var petals_spin = d3.range(Object.keys(this.props.descriptors).length).map((d) => 
				{return {id: 'spin', length: 0.5, petal_idx: d, width: 1}}
			)
		
		var spinData = {};
		spinData['spin'] = {id: 'spin', weight: weight, petals: petals_spin};
		return <PatternGlyph 
							idx={'spin'} 
							color_list_petal={this.color_list_petal}							
							data={spinData}
						/>
	}

	renderSpinGlyph(){
		// console.log(Object.keys(this.props.descriptors).length);
		// var petals_spin = d3.range(Object.keys(this.props.descriptors).length).map((d) => 
		// 		{return {id: 'spin', length: 0.5, petal_idx: d, width: 1}}
		// 	)
		
		// var spinData = {};
		// spinData['spin'] = {id: 'spin', weight: 0, petals: petals_spin};
		// console.log(spinData);
		// const spinGlyph = <PatternGlyph 
		// 					idx={'spin'} 
		// 					data={spinData}
		// 				/>
		// const antIcon = <Icon type="loading" style={{ fontSize: 24 }} spin />;

		return <div className={"spin"}><Spin size={"large"} spinning={true}/></div>
	}

	renderRadioButton(){
		var color_list_petal = this.color_list_petal;	
		// checked={(this.props.display_projection == i)? true: false};

		return Object.keys(this.props.descriptors).map((d, i) => 
			 (<Radio 
			 	shape={"circle"}			 	
			 	defaultChecked={false}
			 	checked={false}
			 	style={{color: color_list_petal[i]}} 
			 	value={i}>
					{d}
			</Radio>)
		)
		// render the radio button group
	}

	renderUpdateButton(){
		const {selectedPatterns} = this.props;
		// if(selectedPatterns.length > 1){
		// 	return (

		// 		)
		// }
	}	

	render() {
		console.log('circularView rendered');
		const { data, selectedPatterns,
				mostSimilarPatternToSelectedPatternIdx,
				leastSimilarPatternToSelectedPatternIdx, 
				arc_positions_bar_petal,item_max_pattern,
				bar_data, max_pattern_item,modes,updateItemPostionsFlag,
				queries, similarPatternToQueries, item_links, descriptors,
				mouseOveredDescriptorIdx, item_similarity, components_cnt,
				display_projection,
				itemEmbeddings_1d,itemEmbeddings_2d,
				patternEmbeddings,deletedPatternIdx,mergePatternIdx } = this.props;  


		if(selectedPatterns.length == 0){
			d3.select('.pattern_circles').attr('stroke', 'grey');                                      
			d3.select('.pattern_circles').attr('stroke-opacity', 0.3);
			d3.select('.pattern_mini_circles').attr('stroke', 'grey');
			d3.select('.pattern_mini_circles').attr('stroke-opacity', 0.3);	
		}
		const ButtonGroup = Button.Group;
		const confirm = Modal.confirm;
		const RadioButton = Radio.Button;
		const RadioGroup = Radio.Group;


		let	descriptor_size = Object.keys(bar_data).length,
			descriptor_size_list = Object.keys(bar_data).map((d) => Object.keys(bar_data[d][0]).length),
			color_list = ['#FFD700', '#beaed4'],
			used_color = '',
			shift_size = 0.,
			label_flag = false,
			reorder_item = false,
			translate_x = 0,
			translate_y = 0,
			draw_label = true,
			top_k = 5;


		var patternEmbedding_original = patternEmbeddings['mds'];
		var min_tsne = [d3.min(patternEmbedding_original, (d) => d[0]), d3.min(patternEmbedding_original, (d) => d[1])];
		var max_tsne = [d3.max(patternEmbedding_original, (d) => d[0]), d3.max(patternEmbedding_original, (d) => d[1])];
		var petal_Radius = this.outerCircleRadius * Math.sin(360 / (descriptor_size*2) * (Math.PI / 180)) + 0.5;
		var size_petal_radius = d3.scaleLinear().domain([0, 1]).range([1, petal_Radius]);
		var size_petal_arc = d3.scaleLinear().domain([0, 1]).range([0, 2 * Math.PI * this.outerCircleRadius/ descriptor_size]);



		const _self = this,
					width = +this.layout.svg.width,
					height = +this.layout.svg.height,
					outerRadius = Math.min(width, height) - 20,
					innerRadius = this.circularInnerRadius,
					barFillOpacityConst = 0.5, 
					query_flag = (Object.keys(queries).length == 0)? false: Object.keys(queries).map(function(key){			
						return queries[key].length;
					}).reduce((a,b)=>a+b);			

		this.query_flag = query_flag;
		let g,
			svg = new ReactFauxDOM.Element('svg');
		svg.setAttribute('width', width+200);
		svg.setAttribute('height',height+300);
		svg.setAttribute('transform', 'translate(' + translate_x + ',' + translate_y + ')');

		this.pie = d3.pie().sort(null).value((d) => 1);
		this.circle_color = d3.scaleLinear().domain([0, 1]).range(['#bf5b17','#e31a1c']).interpolate(d3.interpolateHcl);
		this.circle_width = d3.scaleLinear().domain([0, 1]).range([1,2]);
		this.circle_position_x = d3.scaleLinear().domain([min_tsne[0],max_tsne[0]]).range([+ 5 - this.innerCircleRadius*2, + innerRadius + this.innerCircleRadius*2]);
		this.circle_position_y = d3.scaleLinear().domain([min_tsne[1],max_tsne[1]]).range([+ 5 - this.innerCircleRadius*2, + innerRadius + this.innerCircleRadius*2]);

		for(var i = 0; i < selectedPatterns.length; i++){
			if(!d3.select('#pattern_' + selectedPatterns[i]).empty()){
				used_color = d3.select('#pattern_' + selectedPatterns[i]).attr('stroke');   
				color_list.splice( color_list.indexOf(used_color), 1 );				
			}
		}

		data.forEach((d, i) => {			
				d.x = _self.circle_position_x(patternEmbedding_original[i][0]);
				d.y = _self.circle_position_y(patternEmbedding_original[i][1]);
				d.radius = parseInt(gs.innerCircleRadius);
			}
		);

		// Update the position of merged patterns.
		mergePatternIdx.map((d) => {
			data[d.target].x =  (data[d.target].x + data[d.source].x) / 2;
			data[d.target].y =  (data[d.target].y + data[d.source].y) / 2;
			data[d.target].radius =  (data[d.target].radius + data[d.source].radius) / 2;

		})
		var simulation = d3.forceSimulation(data)
			.force("x", d3.forceX(function(d) { return d.x; }).strength(0.1))
			.force("y", d3.forceY(function(d) { return d.y; }).strength(0.1))
			.force("collide", d3.forceCollide().radius(function(d){ return 0.8*d.radius }))
			.force("manyBody", d3.forceManyBody().strength(-1))
			.stop();
  		for (var i = 0; i < 2000; ++i) simulation.tick();


		// var simulation = d3.forceSimulation(data)
		// 	.force("x", d3.forceX(function(d) { return d.x; }).strength(0.05))
		// 	.force("y", d3.forceY(function(d) { return d.y; }).strength(0.05))
		// 	.force("collide", d3.forceCollide().radius(function(d){ return 1.*d.radius }))
		// 	.force("manyBody", d3.forceManyBody().strength(-5))
		// 	.stop();
  // 		for (var i = 0; i < 2000; ++i) simulation.tick();

			// .force("center", d3.forceCenter((width)/2-(innerRadius)/2, (height)/2-( innerRadius)/2))


		// draw the backdrop
		const backdrop = d3.select(svg)
						.append('g')
						.attr('class', 'background')
						.attr('transform', 'translate(100,100)'),
					gFlowers = backdrop
						.append('g')
						.attr('transform', 'translate(' + ((width)/2-(innerRadius)/2) + ',' + ((height)/2-( innerRadius)/2) + ')')
						.attr('class', 'g_flowers');

 
		// DRAW THE RADIAL BAR CHART
		for(let descriptor_index = 0; descriptor_index < descriptor_size; descriptor_index++){
			let selected_pattern_cnt = selectedPatterns.length;
			
			// when selected more than one pattern, show the distribution of selected patterns.
			if(selected_pattern_cnt > 0) {
				draw_bars_circular(bar_data, descriptor_index, max_pattern_item, selectedPatterns, descriptor_size, descriptor_size_list, this.layout.detailView.margin, width, height);
				// only show the line pointer (dominating items) when one pattern is selected.
				// if (selected_pattern_cnt == 1) {
				// 	draw_line_pointer(descriptor_index, arc_positions_bar_petal);
				// }
			}else{
				// draw the bar for the default values that show the average of the patterns.
				draw_bars_circular(bar_data, descriptor_index, max_pattern_item, [components_cnt], descriptor_size, descriptor_size_list, this.layout.detailView.margin, width, height);
			}
			// when two patterns are selected for comparison, the query bar also needs to or-ordered. 
			reorder_item = (selected_pattern_cnt == 2)? true : false;
			// let query_pattern_idx = (selected_pattern_cnt > 0)? selectedPatterns : [components_cnt];
			// draw_query_circular(bar_data, descriptor_index, max_pattern_item, query_pattern_idx, descriptor_size, descriptor_size_list, this.layout.detailView.margin, width, height, reorder_item = reorder_item);
			draw_query_circular(bar_data, descriptor_index, max_pattern_item, [components_cnt], descriptor_size, descriptor_size_list, this.layout.detailView.margin, width, height, selectedPatterns, reorder_item = reorder_item);
		}

		if(display_projection == -1){
			drawPatterns();	

		}else{
			drawItems(display_projection);
		}		



		// deleted patterns reappear
		d3.range(components_cnt).filter((idx1) => deletedPatternIdx.indexOf(idx1) < 0).map((idx) => {			
			d3.select('.pattern_circles#pattern_' + idx).style("display", "inline");
			d3.select('.flower#flower_' + idx).style("display", "inline");
			d3.select('tr.pattern_row_' + idx).style("display", "inline");				
		})


		draw_query_result(similarPatternToQueries, query_flag);

		
		function drawPatterns(){

			d3.selectAll('.detailView').attr("opacity", 1);
			d3.selectAll('.queryView').attr("opacity", 1);					

			// Add the outer circles to the backdrop.
			const circles = gFlowers.selectAll('.pattern_circles')
							.data(data)
							.enter()
							.append('circle')
							.attr('class', 'pattern_circles')
							.attr('r', (d) => d.radius)
							.attr('fill', '#fc8d12')
							.attr('stroke', 'grey')
							.attr('stroke-width', gs.innerCircleStrokeWidth)                
							.attr('fill-opacity', (d) => d.weight) 
							.attr('stroke-opacity', 0.3)						
							.attr('id', (d) => 'pattern_' + d.id)                
							.attr('transform', (d, i) => 'translate(' + d.x + ',' 
										+ d.y + ')')
							.on("mouseover", function(d){
								var curPattern = similarPatternToQueries.filter((sps) => sps.pattern_idx == d.id)
								if(curPattern.length > 0){
									var tooltipHtml = '<div>pattern#' + d.id + '</div>'+ 
									'<div>' +
									"Relevance:" + d3.format(".0%")(curPattern[0].relevance_score)
									+ '</div>';
								}else{
									var tooltipHtml = '<div>pattern#' + d.id + '</div>'+ 
									'<div>' +
									"Dominance:" + d3.format(".0%")(d.weight)
									+ '</div>';
								}
								tooltip.html(tooltipHtml);
								tooltip.show();						
								if (!d3.select('#pattern_' + d.id).classed('selected')){
									d3.select('#pattern_' + d.id).attr('stroke-opacity', 1); 
									d3.select('#pattern_mini_' + d.id).attr('stroke-opacity', 1); 
								}							
							})
							.on("mouseout", function(d){
								tooltip.hide();
								if (!d3.select('#pattern_' + d.id).classed('selected')){
									d3.select('#pattern_' + d.id).attr('stroke-opacity', 0.3);
									d3.select('#pattern_mini_' + d.id).attr('stroke-opacity', 0.3);
								}						
							})									
							.on('click', (d) => {
							
								if (d3.select('#pattern_' + d.id).classed('selected')) {
									_self.props.onUnClickPattern(d.id);
									let cancel_color = d3.select('#pattern_' + d.id).attr('stroke');
									d3.select('#pattern_' + d.id).classed('selected', false); 
									d3.select('#pattern_' + d.id).attr('stroke', 'grey');                                      
									d3.select('#pattern_' + d.id).attr('stroke-opacity', 0.3);
									d3.select('#pattern_mini_' + d.id).attr('stroke', 'grey');
									d3.select('#pattern_mini_' + d.id).attr('stroke-opacity', 0.3);
									
								} else {
									if (selectedPatterns.length < _self.compare_N) {

										let petals_path_items = [];
										_self.props.onClickPattern(d.id, petals_path_items);
										d3.select('#pattern_' + d.id).classed('selected', true);							
										d3.select('#pattern_' + d.id).attr('stroke', color_list[0]);  
										d3.select('#pattern_mini_' + d.id).attr("stroke", color_list[0]); 
										color_list.splice(0, 1);
									}
								}
								
							});
			// plot the flowers
			const flowers = gFlowers.selectAll('.flower')
							.data(data)
							.enter()
							.append('g')
							.attr('class', 'flower')
							.attr('id', (d) => 'flower_' + d.id)
							.attr('transform', (d, i) => 'translate(' +d.x + ',' 
										+ d.y + ')')
							.style("display", "inline");

			
			// bubbles
			var use_bubbles = false,
				use_petal = false;
			if(use_bubbles){
				const petals = flowers.selectAll('.petal')
							.data((d) => _self.pie(d.petals))
							.enter()
							.append('circle')
							.attr('class', 'petal')
							.attr('id', (d) => 'petal_'+d.data.id+'_' + d.index)
							.on("mouseover", function(d, i){
								tooltip.html('<div>descriptor#' + d.data.id +"(" + i + ")" + '</div>'+ 
									'<div>informativeness: ' + d3.format(".0%")(d.data.length) + '</div>' +
									'<div>similarity: ' + d3.format(".0%")(d.data.width) + '</div>');
								tooltip.show();
							})
							.on("mouseout", function(d){
								tooltip.hide();
							})
							// .attr('transform', (d) => {var coords = petal.polarToCartesian(d.endAngle, _self.outerCircleRadius); return 'translate(' +coords.x + ',' 
							// 				+ coords.y + ')';})
							.attr('transform', (d) => petal.rotateTransform((d.startAngle + d.endAngle) / 2 , _self.outerCircleRadius))													
							.attr('r', (d) => size_petal_radius(d.data.length))
							.style('stroke', (d, i) => 'gray')
							.style('fill', (d, i) => axisStroke(i, descriptor_size))
							.style('fill-opacity', (d) => d.data.width);				
			}else if(use_petal){
				const petals = flowers.selectAll('.petal')
						.data((d) => _self.pie(d.petals))
						.enter()
						.append('path')
						.attr('class', 'petal')
						.attr('id', (d) => 'petal_'+d.data.id+'_' + d.index)
						.attr('transform', (d) => petal.rotateAngle((d.startAngle + d.endAngle) / 2))
						.attr('d', (d) => petal.petalPath(d, _self.outerCircleRadius))
						.style('stroke', (d, i) => 'gray')
						.attr('stroke-width', function(d) {   
						})
						.attr('stroke', function(d) {   
						})
						.on("mouseover", function(d, i){
							tooltip.html('<div>descriptor#' + d.data.id +"(" + i + ")" + '</div>'+ 
								'<div>informativeness: ' + d3.format(".0%")(d.data.length) + '</div>' +
								'<div>similarity: ' + d3.format(".0%")(d.data.width) + '</div>');
							tooltip.show();
						})
						.on("mouseout", function(d){
							tooltip.hide();
						})
						.style('fill', (d, i) => axisStroke(i, descriptor_size))
						.style('fill-opacity', (d) => d.data.width);						
			}else{
				// var min_width = d3.min(data, (d) => {console.log(d); return d.data.width});
				// var max_width = d3.max(data, (d) => d.data.width);

				// var color_threshold = d3.scaleQuantize()
				// 	.domain([0, 1]).range([0, 1]);
				var color_threshold = d3.scaleLinear()
					.domain([0, 1]).range([0, 1]);

				// width => similarity
				// height => informativeness
				const petals = flowers.selectAll('.petal')
							.data((d) => _self.pie(d.petals))
							.enter()
							.append('ellipse')
							.attr('class', 'petal')
							.attr('id', (d) => 'petal_'+d.data.id+'_' + d.index)
							.on("mouseover", function(d, i){
								tooltip.html('<div>descriptor#' + d.data.id +"(" + i + ")" + '</div>'+ 
									'<div>informativeness: ' + d3.format(".0%")(d.data.length) + '</div>' +
									'<div>similarity: ' + d3.format(".0%")(d.data.width) + '</div>');
								tooltip.show();
							})
							.on("mouseout", function(d){
								tooltip.hide();
							})						
							.attr('transform', (d) => petal.rotateTransform((d.startAngle + d.endAngle) / 2 , _self.outerCircleRadius))						
							.attr('rx', (d) => size_petal_radius(1))
							.attr('ry', (d) => size_petal_radius(d.data.length))						
							.style('stroke', (d, i) => 'gray')
							.style("display", "inline")
							.style('fill', (d, i) => axisStroke(i, descriptor_size))
							.style('fill-opacity', (d) => color_threshold(d.data.width));
			}
			// https://bl.ocks.org/puzzler10/49f13307e818ea9a909ba5adba5b6ed9		

		}
		
		function drawItems(descriptor_index){

			var itemEmbeddingAll_original = itemEmbeddings_2d[descriptor_index];		
			var all_items = [].concat(...Object.keys(descriptors).map((d) => descriptors[d]))

			var min_coords = [d3.min(itemEmbeddingAll_original, (d) => d[0]), d3.min(itemEmbeddingAll_original, (d) => d[1])];
			var max_coords = [d3.max(itemEmbeddingAll_original, (d) => d[0]), d3.max(itemEmbeddingAll_original, (d) => d[1])];
			var circle_position_x_item = d3.scaleLinear().domain([min_coords[0],max_coords[0]]).range([- 0 - _self.innerCircleRadius*2, + innerRadius + _self.innerCircleRadius*2]);
			var circle_position_y_item = d3.scaleLinear().domain([min_coords[1],max_coords[1]]).range([- 0 - _self.innerCircleRadius*2, + innerRadius + _self.innerCircleRadius*2]);

			// Cast my values as numbers and determine ranges.
			var minmax = {p1: {min:0, max:0}, p2: {min:0, max:0}}
			var itemData = d3.range(itemEmbeddingAll_original.length).map(function(d) {
				return {
					x: circle_position_x_item(itemEmbeddingAll_original[d][0]),
					y: circle_position_y_item(itemEmbeddingAll_original[d][1]),
					label: descriptors[Object.keys(descriptors)[descriptor_index]][d],
					weight: 1,
					radius: 10
				}
			});

			var simulationItem = d3.forceSimulation(itemData)
				.force("x", d3.forceX(function(d) { return d.x; }).strength(0.1))
				.force("y", d3.forceY(function(d) { return d.y; }).strength(0.1))
				.force("collide", d3.forceCollide().radius(function(d){ return 0.8*d.radius }))
				.force("manyBody", d3.forceManyBody().strength(-1))
				.stop();
	  		for (var i = 0; i < 2000; ++i) simulationItem.tick();


			var item_group = gFlowers.selectAll('g')
									.data(itemData)
									.enter().append("g")
									.attr("class", "item_group")
									.attr("transform", 
									"translate(" + 0 + "," + 0 + ")")												
			for(let descriptor_idx = 0; descriptor_idx < descriptor_size; descriptor_idx++){
				if(descriptor_idx == descriptor_index){
					d3.select('.detailView#descriptor_'+descriptor_idx+'_barchart').attr("opacity", 1);
					d3.select('.queryView#query_'+descriptor_idx+'_barchart').attr("opacity", 1);					
				}else{
					d3.select('.detailView#descriptor_'+descriptor_idx+'_barchart').attr("opacity", 0.2);
					d3.select('.queryView#query_'+descriptor_idx+'_barchart').attr("opacity", 0.2);					
				}
			}
			item_group.append("circle")
							.attr("class", "dot")
							.attr("r", (d) => d.radius)
							.attr("id", (d, i) => "item_circle_" + descriptor_index + "_"+ d.label.replace(/\./g, '\\.'))
							.attr("cx", function(d) { return d.x; })
							.attr("cy", function(d) { return d.y; })
							.attr('fill', axisStroke(descriptor_index))
							.attr('stroke', 'grey')
							.attr('stroke-width', gs.innerCircleStrokeWidth)                
							.attr('fill-opacity', barFillOpacityConst)						
							.attr('stroke-opacity', 0.4)
							.on('mouseover', function (d) {								
								d3.selectAll('path#bar_' + descriptor_index+ '_'+ d.label.replace(/\./g, '\\.')).attr("stroke-width", "2px");
								d3.selectAll('circle#item_circle_' + descriptor_index+ '_'+ d.label.replace(/\./g, '\\.')).attr("stroke", "black");

							})
							.on('mouseout', function (d) {                
								d3.selectAll('path#bar_' + descriptor_index+ '_'+ d.label.replace(/\./g, '\\.')).attr("stroke-width", "0px");
								d3.selectAll('circle#item_circle_' + descriptor_index+ '_'+ d.label.replace(/\./g, '\\.')).attr("stroke", "grey");
							});

			  
			item_group.append("text")
							.attr('class', 'labeltext')		
							.attr("id", (d, i) => "item_text_" + descriptor_index + "_"+ d.label.replace(/\./g, '\\.'))																
							.text((d) => {return d.label.replace(/\./g, '\\.')})
							.attr("x", function(d) { 								
								return d.x-2; })
							.attr("y", function(d) { return d.y+2; })							
							.attr("font-size", "8px")							
							
							// .attr("display", "none");
			if(_self.props.editable_flag){
				item_group.call(d3.drag()
								.on("start", dragstarted)
								.on("drag", dragged)
								.on("end", dragended));			            							
			}
			function dragstarted(d, i) {
				d3.select("circle#item_circle_" + descriptor_index+ '_'+ d.label.replace(/\./g, '\\.')).classed("drag_active", true);
				// d3.select("text#item_text_" + descriptor_index+ '_'+ d.label).classed("drag_active", true);				
				// d3.selectAll(".labeltext").attr("display", "inline");
			}

			function dragged(d, i) {
				var cur_x = d3.event.sourceEvent.offsetX - ((width)/2-(innerRadius)/2) - 100;
				var cur_y = d3.event.sourceEvent.offsetY - ((height)/2-( innerRadius)/2) - 100;				 
				d3.select("text#item_text_" + descriptor_index+ '_'+ d.label.replace(/\./g, '\\.'))
						.attr("x", cur_x)
						.attr("y", cur_y);
				d3.select("circle#item_circle_" + descriptor_index+ '_'+ d.label.replace(/\./g, '\\.'))
						.attr("cx", cur_x)
						.attr("cy", cur_y);
				// d3.selectAll(".labeltext").attr("opacity", 1);
			}

			function dragended(d, i) {
				d3.select("circle#item_circle_" + descriptor_index+ '_'+ d.label.replace(/\./g, '\\.')).classed("drag_active", false);
				// d3.select("text#item_text_" + descriptor_index+ '_'+ d.label).classed("drag_active", false);
				_self.handleMoveItemPosition(i, descriptor_index,
					[circle_position_x_item.invert(d3.select("circle#item_circle_" + descriptor_index+ '_'+ d.label.replace(/\./g, '\\.')).attr("cx")), 
					circle_position_y_item.invert(d3.select("circle#item_circle_" + descriptor_index+ '_'+ d.label.replace(/\./g, '\\.')).attr("cy"))]);
				// d3.selectAll(".labeltext").attr("display", "none");
			}
		}


		function draw_query_result(similarPatternToQueries, query_flag){
			/**
			 * Draws the query result on to the patterns.
			 *
			 * if there is query input, draws the query output in terms of rankings as text to center of the flowers.
			 * otherwise, remove the ranking text.
			 *
			 * @since      0.0.0
			 *
			 *
			 * @param {array}   similarPatternToQueries           a ranked list of similarity between pattern and query.
			 * @param {boolean}  query_flag     if there is query input.
			 * 
			 */			
			if(query_flag){
				var min_relevance = d3.min(similarPatternToQueries, (d) => d.relevance_score);
				var max_relevance = d3.max(similarPatternToQueries, (d) => d.relevance_score);
				var fill_scale = d3.scaleLinear().domain([min_relevance, max_relevance]).range([0, 1]);
				for(let similarIndex = 0; similarIndex < similarPatternToQueries.length; similarIndex++){
					// similarPatternToQueries[similarIndex]
					gFlowers.select(".pattern_circles#pattern_" + similarPatternToQueries[similarIndex].pattern_idx)
							.attr('fill-opacity', fill_scale(similarPatternToQueries[similarIndex].relevance_score));
					d3.select(".pattern_circles_mini#pattern_mini_" + similarPatternToQueries[similarIndex].pattern_idx)
							.attr('fill-opacity', fill_scale(similarPatternToQueries[similarIndex].relevance_score));

				}

			}else{
				for(let similarIndex = 0; similarIndex < similarPatternToQueries.length; similarIndex++){
					// similarPatternToQueries[similarIndex]
					gFlowers.select(".pattern_circles#pattern_" + similarPatternToQueries[similarIndex].pattern_idx)
							.attr('fill-opacity', similarPatternToQueries[similarIndex].dominance);
					d3.select(".pattern_circles_mini#pattern_mini_" + similarPatternToQueries[similarIndex].pattern_idx)
							.attr('fill-opacity', similarPatternToQueries[similarIndex].dominance);

				}
			}

		}


		function draw_bars_circular(bar_data, descriptor_index, max_pattern_item, patternIndices, descriptor_size, descriptor_size_list, margin, width, height, draw_label = true){
			/**
			 * Draws the circular bar for each descriptor
			 *
			 * 1) obtain the bar data for the selected patterns.
			 * 2) re-order the items if two patterns are selected for comparison.
			 * 3) draw arc bars
			 * 4) add labels
			 * otherwise, remove the ranking text.
			 *
			 * @since      0.0.0
			 *
			 *
			 * @param {array}   similarPatternToQueries           a ranked list of similarity between pattern and query.
			 * @param {boolean}  query_flag     if there is query input.
			 * 
			 */					
			let patterns, items, items1, descriptor_arcs;
			patterns = patternIndices.map((pattern_id) => bar_data[descriptor_index][pattern_id]);
			items = Object.keys(bar_data[descriptor_index][components_cnt]).filter((d) => d !== 'id').sort();
			
			// items = items.map((d, idx) => [d, itemEmbeddings_1d[descriptor_index][idx][0]])
			// 			.sort((first, second) => second[1] - first[1])
			// 			.map((d) => d[0]);
			if(patterns.length == 2){
				let zero_items;
				zero_items = Object.keys(bar_data[descriptor_index][components_cnt]).filter((d) => d !== 'id').filter((key) => {
					return (bar_data[descriptor_index][patternIndices[0]][key] < 1e-3 && bar_data[descriptor_index][patternIndices[1]][key] < 1e-3)
				});
				// re-ordering the items based on the difference between the two patterns on each descriptor.
				items1 = Object.keys(bar_data[descriptor_index][components_cnt+1])
								.filter((d) => d !== 'id')
								.filter((d) => zero_items.indexOf(d) < 0)
								.map((key) => [key, bar_data[descriptor_index][components_cnt+1][key]])
								.sort((first, second) => second[1] - first[1]);
				items = items1.map((key) => key[0]);	
			}
			// X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
			console.log(items);
			console.log(computeDescriptorRange(descriptor_index, descriptor_size, descriptor_size_list, shift_size));
			const x = d3.scaleBand()
							.range(computeDescriptorRange(descriptor_index, descriptor_size, descriptor_size_list, shift_size))    
							.domain(items) // The domain of the X axis is the list of states.
							.paddingInner(0.05),
						y = scaleRadial()
							.range([innerRadius, outerRadius])   // Domain will be define later.
							.domain([0, 5]), // Domain of Y is from 0 to the max seen in the data
						bar_opacity = d3.scaleLinear()
							.range([0, 0.8])
							.domain([0, d3.max(patterns, (d) =>
								d3.max(items, (key) => d[key])) ]
							);
						g = backdrop.append('g')
							.attr('class', 'detailView')
							.attr('id', 'descriptor_'+descriptor_index+'_barchart')          
							.attr('transform', 'translate(' + (width / 2) + ',' + ( height/2 )+ ')'); 

			descriptor_arcs = g.selectAll('g')
							.select('#descriptor' + descriptor_index)
							.data(patterns)
							.enter()                                    
							.selectAll('path')
							.data((d,cur_index) => 								
								items.map((key) => (
									{key: key, value: d[key], id: d.id, index: cur_index}
								)))
							.enter()
			// Add the bars
			descriptor_arcs.append('path')
					.attr('d', d3.arc()     // imagine your doing a part of a donut plot
					.innerRadius(innerRadius)
					.outerRadius((d) => y(d.value))
					.startAngle((d) => x(d.key) + x.bandwidth()*(d.index)/patterns.length)
					.endAngle((d) => x(d.key) + x.bandwidth()*(d.index+1)/patterns.length)
					.padAngle(0.01)
					.padRadius(innerRadius))
					.attr('id', (d)=> 'bar_' + descriptor_index + '_' + d.key)
					.attr('fill', (d) => barFill(d, descriptor_index, descriptor_size, bar_opacity))
					.attr('opacity', (d) => barFillOpacity(d, descriptor_index, descriptor_size, _self.foregroundBarOpacity, _self.backgroundBarOpacity,bar_opacity))       
					.attr('stroke', 'black')
					.attr('stroke-width', "0px")
					.on("mouseover", function(d){
						// d3.selectAll("circle.rank"+d.x.toString()).attr("stroke", "#ffab00");
						// d3.selectAll("circle.rank"+d.x.toString()).attr("stroke-width", "6px");

						tooltip.html('<span>' + d.key + "(" + d3.format(".0%")(d.value) + ")"+ '</span>');
						tooltip.show();
						d3.selectAll('circle#item_circle_' + descriptor_index+ '_'+ d.key).attr("stroke", "black");

					})
					.on("mouseout", function(d){
						// d3.selectAll("circle.rank"+d.x.toString()).attr("stroke", "none");
						tooltip.hide();
						d3.selectAll('circle#item_circle_' + descriptor_index+ '_'+ d.key).attr("stroke", "grey");
					})			


			// Add the labels     
			backdrop.selectAll("text.label_bar" + descriptor_index).remove();

			// var draw_label = true;
			const label_length = 12;
			var draw_flag = true;
			// if(patterns.length == 2){
			// 	draw_flag = d3.selectAll('text.compare').empty() ? true:false;
			// }
			if(draw_label && draw_flag){
				descriptor_arcs.append('g')
					.attr('class', 'descriptor_text' + descriptor_index)
					.attr('text-anchor', (d) => (x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length + Math.PI) % (2 * Math.PI) < Math.PI ? 'end' : 'start')
					.attr('transform', (d) => 'rotate(' + ((x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length) * 180 / Math.PI - 90) + ')'+'translate(' + (y(d.value)+10) + ',0)')
					.append('text')
					.text((d) => {
						if(d.index == 0){
							return (d.key.length > label_length) ? d.key.slice(0, label_length)+"..." : d.key;	
						}else{
							return '';
						}						
					})
					.attr('transform', (d) => (x(d.key) + x.bandwidth()*(d.index+0.5)/patterns.length + Math.PI) % (2 * Math.PI) < Math.PI ? 'rotate(180)' : 'rotate(0)')
					.style('font-size', '6px')
					.attr('id', (d) => 'label_' + descriptor_index + '_' + d.key)
					.attr('class', 'label_bar' + descriptor_index + (reorder_item)? ' compare':'')					
					.attr('alignment-baseline', 'middle')
					.on("mouseover", function(d){
						tooltip.html('<span>' + d.key + '</span>');
						tooltip.show();
					})
					.on("mouseout", function(d){
						tooltip.hide();
					});
			}
	
		}

		function draw_query_circular(bar_data, descriptor_index, max_pattern_item, patternIndices, descriptor_size, descriptor_size_list, margin, width, height, selectedPatterns, reorder_item = false){
			/**
			 * Draws the circular bar for input query and visualize item similarity
			 *
			 * 1) obtain the bar data for the selected patterns.
			 * 2) re-order the items if two patterns are selected for comparison.
			 * 3) draw arc bars and attach click and mouseover events
			 * 4) draw the link between items
			 * otherwise, remove the ranking text.
			 *
			 * @since      0.0.0
			 *
			 *
			 * @param {array}   similarPatternToQueries           a ranked list of similarity between pattern and query.
			 * @param {boolean}  query_flag     if there is query input.
			 * 
			 */				
			let patterns, items, items1, descriptor_arcs, query_bar;
			
			patterns = patternIndices.map((pattern_id) => bar_data[descriptor_index][pattern_id]);
			items = Object.keys(bar_data[descriptor_index][components_cnt]).filter((d) => d !== 'id').sort();			
			
			// items = items.map((d, idx) => [d, itemEmbeddings_1d[descriptor_index][idx][0]])
			// 			.sort((first, second) => second[1] - first[1])
			// 			.map((d) => d[0]);

			if(reorder_item){

				let zero_items;
				zero_items = Object.keys(bar_data[descriptor_index][components_cnt]).filter((d) => d !== 'id').filter((key) => {
					return (bar_data[descriptor_index][selectedPatterns[0]][key] < 1e-3 && bar_data[descriptor_index][selectedPatterns[1]][key] < 1e-3)
				});
				items1 = Object.keys(bar_data[descriptor_index][components_cnt+1])
								.filter((d) => d !== 'id')
								.filter((d) => zero_items.indexOf(d) < 0)								
								.map((key) => [key, bar_data[descriptor_index][components_cnt+1][key]])
								.sort((first, second) => second[1] - first[1]);
				items = items1.map((key) => key[0]);	
			}	
			// X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
			const x = d3.scaleBand()
							.range(computeDescriptorRange(descriptor_index, descriptor_size, descriptor_size_list, shift_size))    
							.domain(items) // The domain of the X axis is the list of states.
							.paddingInner(0.05),
						y = scaleRadial()
							.range([innerRadius-20, innerRadius])   // Domain will be define later.
							.domain([0, 3]), // Domain of Y is from 0 to the max seen in the data
						bar_opacity = d3.scaleLinear()
							.range([0, 1])
							.domain([0, d3.max(patterns, (d) =>
								d3.max(items, (key) => d[key])) ]
							),
						line_width = d3.scaleLinear()
							.range([0, 2])
							.domain([0, 1]),
						g = backdrop.append('g')
							.attr('class', 'queryView')
							.attr('id', 'query_'+descriptor_index+'_barchart')          
							.attr('transform', 'translate(' + (width / 2) + ',' + ( height/2 )+ ')'); 

			descriptor_arcs = g.selectAll('g')
							.select('#query' + descriptor_index)
							.data(patterns)
							.enter()                                    
							.selectAll('path')
							.data((d,cur_index) => 
									items.map((key) => (
										{key: key, value: d[key], id: d.id, index: cur_index}
									)))
							.enter()
			// Add the bars
			query_bar = descriptor_arcs.append('path')
					.attr('d', d3.arc()     // imagine your doing a part of a donut plot
					.innerRadius(innerRadius-10)
					.outerRadius((d) => y(0))
					.startAngle((d) => x(d.key) + x.bandwidth()*(d.index)/patterns.length)
					.endAngle((d) => x(d.key) + x.bandwidth()*(d.index+1)/patterns.length)
					.padAngle(0.01)
					.padRadius(innerRadius-10))
					.attr('class', (d) => 'query_bar query_' + descriptor_index)
					.attr('id', (d)=> 'query_bar_' + descriptor_index + '_' + d.key)
					.attr('fill', (d) => barFill(d, descriptor_index, descriptor_size, bar_opacity))
					.attr('opacity', barFillOpacityConst)       
					.attr('stroke', 'none')
					.attr('stroke-width', '3px')
					.on('click', (d) => {
						if (d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).classed('queried')) {
							queries[descriptor_index].pop(d.key);
							_self.props.onClickItem(queries, top_k);
							d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("stroke", "none");
							d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).classed('queried', false);

						} else {
							if(!(descriptor_index in queries)){
								queries[descriptor_index] = [];	
							}
							queries[descriptor_index].push(d.key);							
							_self.props.onClickItem(queries, top_k);
							// d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("stroke", "black");
							// d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).classed('queried', true);
						}						
					})
					.on('mouseover', (d) => {
						d3.selectAll('circle#item_circle_' + descriptor_index+ '_'+ d.key).attr("stroke", "black");						
						// d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("opacity",1);
						// Object.keys(item_similarity[descriptor_index][d.key]).map(function(key){										
						// 	d3.select('#query_bar_' + descriptor_index+ '_'+ key).attr("opacity", item_similarity[descriptor_index][d.key][key]);
						// });
						// var cur_key_idx = Object.keys(item_similarity[descriptor_index]).indexOf(d.key);
						// const top_k_item = 5;
						// // Create items array
						// var top_items = Object.keys(item_similarity[descriptor_index][d.key]).map((key) => {
						// 	return [key, item_similarity[descriptor_index][d.key][key]];
						// });
						// // Sort the array based on the second element
						// top_items.sort(function(first, second) {
						// 	return second[1] - first[1];
						// });	
						// top_items = top_items.slice(0, top_k_item);
						// let bars_item = top_items.map((key) => {
						// 	return {
						// 		'transform_bar': backdrop.select('g#query_'+descriptor_index+'_barchart').attr('transform'),
						// 		'q_bar_end': backdrop.select('path#query_bar_'+descriptor_index+'_'+key[0]).attr('d'),
						// 		'transform_g_flower': backdrop.select('g.g_flowers').attr('transform'),
						// 		'key': key[0],
						// 		'idx': cur_key_idx,
						// 		'item_cnt': Object.keys(item_similarity[descriptor_index][d.key]).length+1,
						// 		'similarity': item_similarity[descriptor_index][d.key][key[0]]
						// 	}
						// }),q_bar_start = backdrop.select('path#query_bar_'+descriptor_index+'_'+d.key).attr('d');

						// _self.props.onMouseOverItem(descriptor_index, d.key, q_bar_start, bars_item);

					})
					.on('mouseout', (d) => {
						d3.selectAll('circle#item_circle_' + descriptor_index+ '_'+ d.key).attr("stroke", "grey");												
						// d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("opacity",barFillOpacityConst);
						// // d3.select('#query_bar_' + descriptor_index+ '_'+ d.key).attr("stroke","none");
						// Object.keys(item_similarity[descriptor_index][d.key]).map(function(key){										
						// 	d3.select('#query_bar_' + descriptor_index+ '_'+ key).attr("opacity", barFillOpacityConst);
						// });
						// _self.props.onMouseOutItem();
					});		
	
			g.selectAll('.query_bar').attr("stroke", "none");							
			g.selectAll('.query_bar').classed('queried', false);							

			Object.keys(queries).map((d) => {
				queries[d].map((key) => {
					g.selectAll('#query_bar_' + d+ '_'+ key).attr("stroke", "black");							
					g.selectAll('#query_bar_' + d+ '_'+ key).classed('queried', true);							
				})
			})




			var draw_correlation_link = false; 
			if(draw_correlation_link){
				var link_opacity = d3.scaleLinear()
								.range([barFillOpacityConst, 1]).domain([d3.min(item_links, (d) => d.similarity), d3.max(item_links, (d) => d.similarity)]);
				for(let link_id = 0; link_id < item_links.length; link_id++){								
					if(item_links[link_id].similarity > 0){
						quadPath.drawQuadratic(gFlowers, item_links[link_id], axisStroke(mouseOveredDescriptorIdx, descriptor_size), link_opacity);
					}								
				}

			}

		}	



		function showConfirmDelete() {
			var title1 = '',
				deleteFlag = selectedPatterns.length > 0;
			if(deleteFlag){
				title1 = 'Do you want to delete the following patterns?';			
			}else{
				title1 = 'Please select at least one pattern to delete';
			}			
			confirm({
				title: 'Do you want to delete these patterns?',
				content: _self.renderGlyph(selectedPatterns),
				onOk() {	
					if(deleteFlag){
						_self.handleDeletePattern(selectedPatterns);
					}	
				},
				onCancel() {},
				});
		}
		function showConfirmMerge() {
			var title1 = '',
				mergeFlag = selectedPatterns.length == 2;
			if(mergeFlag){
				title1 = 'Do you want to merge the following patterns?';			
			}else{
				title1 = 'Please select two patterns to merge';
			}
			confirm({
				title: title1,
				content: _self.renderGlyph(selectedPatterns),
				onOk() {					
					if(mergeFlag){
						_self.handleMergePattern(selectedPatterns);
					}					
				},
				onCancel() {},
				});
		}
		function showConfirmUpdate() {
			confirm({
				title: 'Do you want to update the patterns?',
				content: '',
				onOk() {	
					_self.handleUpdatePattern();
				},
				onCancel() {},
				});
		}

		function onSwithEdit(checked) {
			// console.log(checked);
			// _self.editable_flag = checked;
			// console.log(_self.editable_flag);
			_self.handleSwithEdit(checked);
		}

		function axisStroke(i, descriptor_size) {
			// var _self.color_list_petal = ["#85D4E3", "#F4B5BD", "#9C964A", "#CDC08C", "#FAD77B"];
			return _self.color_list_petal[i];
			// return d3.hcl(i / descriptor_size * 360, 60, 70);
		};

		function computeDescriptorRange(descriptor_index, descriptor_size,descriptor_size_list, shift_size){
			/**
			 * Compute the start angle and end angle for descriptor
			 * 2 solutions 
			 * a.1) compute the total size of a descriptor divided by descriptor count
			 * a.2) obtain the maximum size of descriptor
			 * a.3) compute each item size by dividing 1) by 2)
			 * 
			 * b.1) compute the unit size by dividing total item cnt
			 * b.2) obtain the maximum size of descriptor
			 * b.3) compute each item size by dividing 1) by 2)
			 *
			 * @since      0.0.0
			 *
			 *
			 * @param {array}   similarPatternToQueries           a ranked list of similarity between pattern and query.
			 * @param {boolean}  query_flag     if there is query input.
			 * 
			 */		

			// solution a
			var total_size = 2*Math.PI/descriptor_size,
				max_item_cnt = d3.max(descriptor_size_list),
				each_value = total_size*1. / max_item_cnt,
				total_value_current = each_value * descriptor_size_list[descriptor_index],
				start_value = 2*Math.PI*(descriptor_index+1)/descriptor_size + shift_size + (total_size - total_value_current) / 2.0,
				end_value = 2*Math.PI*(descriptor_index+2)/descriptor_size - (total_size - total_value_current) / 2.0;

			// solution b
			// let new_array = [];			
			// descriptor_size_list.reduce( (prev, curr,i) =>  new_array[i] = prev + curr , 0 );
			// new_array = [0].concat(new_array);
			// new_array = new_array.concat(new_array);
			// var total_item_size = _.sum(descriptor_size_list),
			// 	start_value,
			// 	end_value,
			// 	start_value = (2*Math.PI*new_array[descriptor_index])/total_item_size,
			// 	end_value = (2*Math.PI*new_array[descriptor_index+1])/total_item_size;
			if(start_value > end_value){				
				return [end_value, start_value];
			}else{
				return [start_value, end_value];
			}
			
		}  

		function barFill(d, descriptor_index, descriptor_size, bar_opacity) {
			if(d.id >= components_cnt){
				return axisStroke(descriptor_index, descriptor_size);
			}
			return d3.select('#pattern_' + d.id).attr('stroke');
			// return color_pick(bar_opacity(d.value));
		}
		function barFillOpacity(d, descriptor_index, descriptor_size, foregroundBarOpacity, backgroundBarOpacity,bar_opacity) {
			return (d.id >= components_cnt)? barFillOpacityConst : 1;
		};

		console.log(_self.props.editable_flag);
		return (
			<div className={styles.CircularOverview}>					
				<div className={index.title}>Circular View
					<Tooltip title="Pattern Examination">
    					<Icon style={{ fontSize: '12px', float: "right" }} type="info-circle" />
  					</Tooltip>					
				</div>
				<div>
					<div>
						<RadioGroup
							onChange={this.handleChangeProjection}							
							defaultValue={-1} 
							size="small">
							<Radio shape="circle" value={-1}>Pattern</Radio>	
							{this.renderRadioButton()}				
						</RadioGroup>																							
					    <Switch style={{ float: "right" }} onChange={onSwithEdit} checkedChildren="lock" unCheckedChildren="unlock" />					
					</div>
					
						{_self.props.editable_flag? 					
							<div>
							<Button size="small" onClick={showConfirmDelete}  disabled={this.showButton(1)}>
								Delete
							</Button>							
							<Button size="small" onClick={showConfirmMerge} disabled={this.showButton(2)}>
								Merge
							</Button>	
							<Button size="small" onClick={this.handleResetPatterns} disabled={this.showButton(1)}>
								Reset Pattern Selection
							</Button>							
							<Button size="small" onClick={this.handleResetItems} disabled={this.showButton(4)}>
								Reset Item Selection
							</Button>
							<Button size="small" onClick={showConfirmUpdate} disabled={this.showButton(3)}>
								Update
							</Button>
							</div>:
							<div>
								<Button size="small" onClick={this.handleResetPatterns} disabled={this.showButton(1)}>
									Reset Pattern Selection
								</Button>							
								<Button size="small" onClick={this.handleResetItems} disabled={this.showButton(4)}>
									Reset Item Selection
								</Button>
							</div>}		
													
				</div>				
				{!this.props.updatingFlag ? svg.toReact() : this.renderSpinGlyph()}
			</div>
		);
  }
}
export default CircularView;