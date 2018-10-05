import React, { Component } from 'react';
// import Vis1 from 'components/Vis1';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import * as petal from '../../lib/draw_petals.js'

import styles from './styles.scss';
import gs from '../../config/_variables.scss'; // gs (=global style)

class InspectionView extends Component {
  constructor(props) {
		super(props);
		this.state = {
		};
    this.outerCircleRadius = Number(gs.outerCircleRadius);
    this.outerCircleRadius = 50;
    this.innerCircleRadius = Number(gs.innerCircleRadius);
    this.innerCircleStrokeWidth = Number(gs.innerCircleStrokeWidth);
    this.innerCircleStrokeOpacity = Number(gs.innerCircleStrokeOpacity);
    this.outerCircleStrokeWidth = Number(gs.outerCircleStrokeWidth);
    this.outerCircleStrokeOpacity = Number(gs.outerCircleStrokeOpacity);

	}

	componentWillMount() {
  }

  renderInformation(mouseOveredPattern) {
    return (
      <div>{'Dominance: ' + mouseOveredPattern.circles.dominance}
      {this.svg.toReact()}
      </div>
    );
  }
  
  render() {
    if (!this.props.mouseOveredPatternIdx)
      return <div />
    const _self = this;
    const { mouseOveredPattern, data, mouseOveredPatternIdx } = this.props;

    var data_ = data[mouseOveredPatternIdx];
    this.petals = data[mouseOveredPatternIdx].dims;
    data_ = [data_];
    this.svg = new ReactFauxDOM.Element('svg');
    this.svg.setAttribute('width', 300);
    this.svg.setAttribute('height', 300);
    this.svg.setAttribute('transform', "translate(" + this.outerCircleRadius * 3 + "," + this.outerCircleRadius * 3 + ")");   
    this.pie = d3.pie().sort(null).value(function(d) { return 1; });

    const backdrop = d3.select(this.svg)
            .append('g')
            .attr("class", "background");


    // // PLOT THE FLOWERS ==> PATTERNS
    const flowers = backdrop.selectAll('.flower')
                .data(data_)
                .enter().append('g')
                .attr("class", "flower")
                .attr("transform", function(d, i) { 
                    return "translate(" + 100 + "," + 100 + ")"; 
                  });


    const petals = flowers.selectAll(".petal")
              .data((d) => this.pie(d.petals))
              .enter().append("path")
              .attr("class", "petal")
              .attr("transform", (d) => petal.rotateAngle((d.startAngle + d.endAngle) / 2))
              .attr("d", (d) => petal.petalPath(d, this.outerCircleRadius))
              .style("stroke", (d, i) => 'gray')
              .on("mouseover", function(d) {

               })
              .on("mouseout", function(d) {
              })              
              .style("fill", (d, i) => petal.petalFill(d, i, this.petals))
              .style('fill-opacity', 0.8);

    // // ADD THE OUTER CIRCLES TO THE BACKDROP                
    const circles1 = backdrop.selectAll('.circle')
                .data(data_)
                .enter().append('circle')
                .attr("class", "outer_circle")
                .attr("r", this.outerCircleRadius)
                .attr("fill", "white")
                .attr("stroke-width", gs.outerCircleStrokeWidth)
                .attr("stroke-opacity", gs.outerCircleStrokeOpacity)
                .attr("fill-opacity", 0)
                .attr("id", function(d) { return "pattern_" + d.id; })                
                .attr("transform", function(d, i) { 
                  return "translate(" + d.x + "," + d.y + ")"; 
                })
                .on("click", (d) => {
                  if (d3.select("#pattern_" + d.id).classed("selected")) {
                    _self.props.onUnClickPattern(d.id);
                    d3.select("#pattern_" + d.id).classed("selected", false);                                       
                    d3.select("#pattern_" + d.id).attr("stroke", "none");
                  } else {
                    _self.props.onClickPattern(d.id);
                    d3.select("#pattern_" + d.id).classed("selected", true);
                    d3.select("#pattern_" + d.id).attr("stroke", petal.circleStrokeFill(d.id, data.length));
                  }
                });

    // ADD THE INNER CIRCLES TO THE BACKDROP
    const circles = backdrop.selectAll('.circle')
                .data(data_)
                .enter().append('circle')
                .attr("class", "inner_circle")
                .attr("r", gs.innerCircleRadius)
                .attr("fill", "#fc8d62")
                .attr("stroke-width", gs.innerCircleStrokeWidth)                
                .attr("fill-opacity", function(d) { return d.weight; })                         
                .attr("stroke-opacity", gs.innerCircleStrokeOpacity)                                                          
                .attr("transform", function(d, i) { 
                    return "translate(" + d.x + "," + d.y + ")"; 
                  })
                .on("mouseover", function(d) {
                 })
                .on("mouseout", function(d) {
                })
                .on("click", (d) => {
                  if (d3.select("#pattern_" + d.id).classed("selected")) {
                    _self.props.onMouseOutPattern(d.id);
                    d3.select("#pattern_" + d.id).classed("selected", false);                                       
                  } else {
                    _self.props.onMouseOverPattern(d.id);
                    d3.select("#pattern_" + d.id).classed("selected", true);
                  }
                });





    return (
      <div className={styles.InspectionView}>
        <div>Details</div>
        <div className={styles.wrapper}>
          {Object.keys(mouseOveredPattern).length !== 0
            ? this.renderInformation(mouseOveredPattern) 
            : <div />
          }
        </div>
      </div>
    );
  }
}

export default InspectionView;
