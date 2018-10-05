import React, { Component } from 'react';
// import Vis1 from 'components/Vis1';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';

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
              .attr("transform", (d) => rotateAngle((d.startAngle + d.endAngle) / 2))
              .attr("d", (d) => petalPath(d, this.outerCircleRadius))
              .style("stroke", (d, i) => 'gray')
              .on("mouseover", function(d) {

               })
              .on("mouseout", function(d) {
              })              
              .style("fill", (d, i) => petalFill(d, i, this.petals))
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
                    d3.select("#pattern_" + d.id).attr("stroke", circleStrokeFill(d.id, data.length));
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






    function petalPath(d, outerCircleRadius) {      
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

      // var angle = (d.endAngle - d.startAngle) / 2,
      //  s = polarToCartesian(-angle, size_petal_arc(d.data.length), outerCircleRadius),
      //  e = polarToCartesian(angle, size_petal_arc(d.data.length), outerCircleRadius),
      //  c = polarToCartesian(0, size_petal_arc(d.data.length), outerCircleRadius),
      //  r = size_petal_radius(d.data.width),
      //  m = petalRadius(r, outerCircleRadius),
      //  c1 = {x: outerCircleRadius + r / 2, y: s.y},
      //  c2 = {x: outerCircleRadius + r / 2, y: e.y};


      // s - e defines the root length of the petal => default size
      // c defines the root curve of the petal => default size
      // r -> petal length => controlled by similarity
      // c1, c2 curve shape = controlled by entropy

      // var angle = (d.endAngle - d.startAngle) / 2,
      //  s = polarToCartesian(-angle, size_petal_arc(0.8), outerCircleRadius),
      //  e = polarToCartesian(angle, size_petal_arc(0.8), outerCircleRadius),
      //  c = polarToCartesian(0, size_petal_arc(0.9), outerCircleRadius),
      //  r = size_petal_radius(d.data.width),
      //  m = petalRadius(r, outerCircleRadius),
      //  c1 = {x: outerCircleRadius + r / 2, y: s.y + size_petal_curve(d.data.length)},
      //  c2 = {x: outerCircleRadius + r / 2, y: e.y - size_petal_curve(d.data.length)};

      return "M" + s.x + "," + s.y + "Q" + c1.x + "," + c1.y + " " + m.x + "," + m.y +
      "Q" + c2.x + "," + c2.y + " " + e.x + "," + e.y + "Q" + c.x + "," +  c.y +" " + s.x + "," + s.y + "Z";

    };

    function petalRadius(r, outerCircleRadius){
      return {
        x: outerCircleRadius + r, 
        y: 0
      }
    }

    function flowerSum(d) {
      return d3.sum(d.petals, function(d) { return d.length; });
    }


    function rotateAngle(angle) {
      return "rotate(" + (angle / Math.PI * 180 ) + ")";
    }

    function polarToCartesian(angle, arc_length, outerCircleRadius) {
      
      var angle_arc = arc_length / (2 * Math.PI * outerCircleRadius / 3) * angle
      return {
        // start and end of the petal
        // size of the petal
        x: Math.cos(angle_arc) * outerCircleRadius,
        y: Math.sin(angle_arc) * outerCircleRadius
      };
    };

    function petalFill(d, i, petals) {
      return d3.hcl(i / petals * 360, 60, 70);
    };

    function circleStrokeFill(i, patternsCnt) {
      return d3.hcl(i / patternsCnt * 360, 20, 70);
    };    

    function petalStroke(d, i,petals) {
      return d3.hcl(i / petals * 360, 60, 70);
    };
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
