import React, {Component} from 'react';
import Map from './map';
import ListView from './list-view';
import SummaryView from './summary-view';
import {render} from 'react-dom';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
  }

  render() {
    const {viewport, data} = this.state;
    return (
        <div>
        <ListView />
        <Map />
        <SummaryView />
        </div>
    );
  }
}

render(<App />, document.querySelector('.container'));

