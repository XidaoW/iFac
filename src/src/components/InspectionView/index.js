import React, { Component } from 'react';
// import Vis1 from 'components/Vis1';
import * as d3 from 'd3';

import styles from './styles.scss';
import gs from '../../config/_variables.scss'; // gs (=global style)

class InspectionView extends Component {
  constructor(props) {
		super(props);
		this.state = {
		};
	}

	componentWillMount() {
  }

  renderInformation(mouseOveredPattern) {
    return (
      <div>{'Dominance: ' + mouseOveredPattern.circles.dominance}</div>
    );
  }
  
  render() {
    const { mouseOveredPattern } = this.props;

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
