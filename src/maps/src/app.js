import React, {Component} from 'react';
import Map from './map';
import ListView from './list-view';
import SummaryView from './summary-view';
import {render} from 'react-dom';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedIndex: 0
        };
    }

    componentDidMount() {
    }

    handleListClick (e) {
        this.setState({ selectedIndex: e.target.id });
    }

    render() {
        const {viewport, data} = this.state;

        return (
            <div>
            <ListView
            selectedIndex={this.state.selectedIndex}
            onClick = {this.handleListClick.bind(this)}
            />
            <Map
            selectedIndex={this.state.selectedIndex}
            />
            </div>
        );
    }
}

render(<App />, document.querySelector('.container'));

