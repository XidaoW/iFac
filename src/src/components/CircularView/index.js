import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import * as d3Scale from '../../lib/d3-scale-radial.js'

import styles from './styles.scss';
import index from '../../index.css';
import gs from '../../config/_variables.scss'; // gs (=global style)

/* props: this.props.ranking
  => selected ranking data
*/
class CircularView extends Component {
  constructor(props) {
    super(props);

    this.layout = {
      width: 650,
      height: 550,
      svg: {
        width: 650, // 90% of whole layout
        height: 550 // 100% of whole layout
      },
    };
    this.circularViewMarginTop = gs.circularViewMarginTop;
    this.circularViewMarginBottom = gs.circularViewMarginBottom;
    this.circularViewMarginLeft = gs.circularViewMarginLeft;
    this.circularViewMarginRight = gs.circularViewMarginRight;
    this.backgroundBarOpacity = gs.circularViewBKBarOpacity;
    this.foregroundBarOpacity = gs.circularViewFGBarOpacity;

  }


  render() {
    const { data, max_pattern_item, selectedPatterns,components_cnt,modes } = this.props;
    const svg = new ReactFauxDOM.Element('svg'),
          descriptor_size = Object.keys(data).length;
    let g;

    svg.setAttribute('width', this.layout.svg.width);
    svg.setAttribute('height', this.layout.svg.height);
    
    const margin = {top: this.circularViewMarginTop, right: this.circularViewMarginRight, 
                    bottom: this.circularViewMarginBottom, left: this.circularViewMarginLeft},
          width = +this.layout.svg.width - margin.left - margin.right,
          height = +this.layout.svg.height - margin.top - margin.bottom;
    
    // draw the axis for each descriptor
    for(var i = 0; i < descriptor_size; i++){
      // draw_axis(i, width, height, descriptor_size, data, modes);
      draw_bars_circular(data, i, max_pattern_item,[components_cnt], descriptor_size, margin, width, height,modes);
      // if (selectedPatterns.length > 0) {
      //   draw_bars(data, i, max_pattern_item, selectedPatterns, descriptor_size, margin, width, height);
      // }
    }
    function draw_bars_circular(data, i, max_pattern_item, patternIndices, descriptor_size, margin, width, height){
        let patterns, items;
        patterns = patternIndices.map((pattern_id) => data[i][pattern_id]);
        items = Object.keys(data[i][0]).filter((d) => d !== "id").sort();
        var innerRadius = 10;
        var outerRadius = 15;
        var x = d3.scaleBand()
                  .range([2*Math.PI*(i)/descriptor_size,  2*Math.PI*(i+1)/descriptor_size])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
                  .align(0)                  // This does nothing
                  .domain(items); // The domain of the X axis is the list of states.

        // Y scale outer variable
        var y = d3.scaleRadial()
                  .range([innerRadius, outerRadius])   // Domain will be define later.
                  .domain([0, 1]); // Domain of Y is from 0 to the max seen in the data
      
          // Add the bars
          g.append("g")
            .selectAll("path")
            .data(patterns)
            .enter()
            .data(function(d,cur_index) { 
                return items.map(function(key) { 
                    return {key: key, value: d[key], id: d.id, index: cur_index}; 
                }); 
            })
            .append("path")
              .attr("fill", "#69b3a2")
              .attr("class", "yo")
              .attr("d", d3.arc()     // imagine your doing a part of a donut plot
                  .innerRadius(innerRadius)
                  .outerRadius(function(d) { return y(d.value); })
                  .startAngle(function(d) { return x(d.key) + x.bandwidth()*(cur_index)/descriptor_size; })
                  .endAngle(function(d) { return x(d.key) + x.bandwidth()*(cur_index+1)/descriptor_size; })
                  .padAngle(0.01)
                  .padRadius(innerRadius))


          // // Add the labels
          // g.append("g")
          //     .selectAll("g")
          //     .data(data)
          //     .enter()
          //     .append("g")
          //       .attr("text-anchor", function(d) { return (x(d.Country) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
          //       .attr("transform", function(d) { return "rotate(" + ((x(d.Country) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")"+"translate(" + (y(d['Value'])+10) + ",0)"; })
          //     .append("text")
          //       .text(function(d){return(d.Country)})
          //       .attr("transform", function(d) { return (x(d.Country) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
          //       .style("font-size", "11px")
          //       .attr("alignment-baseline", "middle")

  }



    function draw_axis(i, width, height, descriptor_size, data, modes){
      let items;
      items = Object.keys(data[i][0]).filter((d) => d !== "id").sort();
      height = height / descriptor_size;

      const x0 = d3.scaleBand()
              .domain(items)
              .rangeRound([0, width])
              .paddingInner(0.1);

      g = d3.select(svg).append("g")
        .attr("class", "circularView")
        .attr("id", "descriptor"+i)
        .attr("transform", "translate(" + margin.left + "," + ((i)*(height+50)) + ")");

      const axis = g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x0))

      axis.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".01em")      
        .attr("transform", (d) => "rotate(-65)")
        .on('mouseover', function(d,i) {
          d3.select(this).transition()
          .ease(d3.easeCubic)
          .duration('200')
          .attr('font-size', 100)
          .attr('fill', 'springgreen');
        })
        .on('mouseout', function(d,i) {
          d3.select(this).transition()
          .ease(d3.easeCubic)
          .duration('200')
          .attr('font-size', 20)
          .attr('fill', '#333');
        });     

      g.append("text")
        .attr("transform", "rotate(0)")
        .attr("x", 1)
        .attr("dx", "1em")
        .attr("dy", "1em")
        .attr("font-size", 20)
        .attr("text-anchor", "middle")
        .text(modes[i]);

      axis.selectAll("path")
        .attr("stroke", axisStroke(i, descriptor_size)) 
        .attr("stroke-width", 3);           
      axis.selectAll("line")
        .attr("stroke", axisStroke(i, descriptor_size))
        .attr("stroke-width", 2);

    
    }

    function axisStroke(i, descriptor_size) {
      return d3.hcl(i / descriptor_size * 360, 60, 70);
    };
      function draw_bars(data, i, max_pattern_item, patternIndices, descriptor_size, margin, width, height) {
      let patterns, items;

      patterns = patternIndices.map((pattern_id) => data[i][pattern_id]);
      items = Object.keys(data[i][0]).filter((d) => d !== "id").sort();

      height = height / descriptor_size;
      const x0 = d3.scaleBand()
              .domain(items)
              .rangeRound([0, width])
              .paddingInner(0.1),
            x1 = d3.scaleBand()
              .domain(patternIndices)
              .rangeRound([0, x0.bandwidth()])
              .padding(0.05),
            y = d3.scaleLinear()
              .rangeRound([height, 0]),
            bar_opacity = d3.scaleLinear()
              .range([0, 1]),             
            z = d3.scaleOrdinal().range(d3.schemePaired);

      y.domain([0, d3.max(patterns, (d) =>
          d3.max(items, (key) => d[key])) ]
        ).nice();
      bar_opacity.domain([0, d3.max(patterns, (d) =>
          d3.max(items, (key) => d[key])) ]
        );

      g.selectAll(".circularView_col")
        .select("#descriptor" + i)
        .data(patterns)
        .enter().append("g")
        .attr("class","circularView_col")
        .attr("transform", (d) => "translate(" + x1(d.id) + ",0)")
        .selectAll(".rect")
        .data(function(d) { 
          return items.map(function(key) { 
            return {key: key, value: d[key], id: d.id}; 
          }); 
        })
        .enter().append("rect")
        .attr("class", "rect")
        .attr("x", (d) => x0(d.key))
        .attr("y", (d) => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", (d) => height - y(d.value))
              .attr("stroke", function(d) { 
                  return "black";
              })
              .attr("stroke-width", function(d) { 
                // bold the stroke for max_items for each descriptor
                if (typeof max_pattern_item[i][d.id] != 'undefined'){
                  if(d.key == max_pattern_item[i][d.id]){
                    return '3px'; 
                  }else{
                    return '1px'; 
                  }                 
                }else{
                  return '1px';
                } 
              })
          .attr("shape-rendering", "crispEdges")              
        .attr("opacity", function(d) { return barFillOpacity(d, i, descriptor_size,this.foregroundBarOpacity, this.backgroundBarOpacity,bar_opacity); })
        .attr("fill", function(d) { 
          return barFill(d, i, descriptor_size, bar_opacity); 
        });

    }
    function barFill(d, descriptor_index, descriptor_size,bar_opacity) {
      if(d.id >= components_cnt){
        return axisStroke(descriptor_index, descriptor_size);
      }else{
        var cur_color  = d3.select("#pattern_" + d.id).attr("stroke")       
        var color_dark = d3.rgb(cur_color).darker(0.5);
        var color_light = d3.rgb(cur_color).brighter(0.5);
        var color_pick = d3.scaleLinear().domain([0, 1]).range([color_light,color_dark])
        // return d3.select("#pattern_" + d.id).attr("stroke");
        return color_pick(bar_opacity(d.value));
      }
    }
    function barFillOpacity(d, descriptor_index, descriptor_size, foregroundBarOpacity, backgroundBarOpacity,bar_opacity) {

      if(d.id >= components_cnt){
        return 0.1;
      }else{
        return 1;
        // return bar_opacity(d.value);
      }     
    };
    return (
      <div className={styles.PatternOverview}>
        <div className={index.title}>Pattern Detail View</div>      
        {svg.toReact()}
      </div>
    );

  }
}

export default CircularView;




// X scale: common for 2 data series

