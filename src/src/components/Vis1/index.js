import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import './styles.scss';

class Vis1 extends Component {
  render() {

    let svg = new ReactFauxDOM.Element('svg');
  
    svg.setAttribute('width', 200);
    svg.setAttribute('height', 200);
    svg.setAttribute('0 0 200 200');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.setProperty('margin', '0 5%');

    return (
      <div className="Vis1">
        {svg.toReact()}
        Vis1 div here
      </div>
    );
  }
}

export default Vis1;