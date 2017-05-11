// {...viewport}
// width={width}
// height={height}
// layers={layers}
import React, {Component} from 'react';
import MapGL from 'react-map-gl';
import DeckGL, {ScatterplotLayer} from 'deck.gl';
import * as d3 from 'd3';
import _ from 'underscore';
import Overlay from './overlay.js';

import {text as request} from 'd3-request';
import {csv as requestCSV} from 'd3-request';

// Set your mapbox token here
var MAPBOX_TOKEN = 'pk.eyJ1IjoiYXdhaGFiIiwiYSI6ImNpenExZHF0ZTAxMXYzMm40cWRxZXY1d3IifQ.TdYuekJQSG1eh6dDpywTxQ';

let txt = 'gowalla.tsv'
let head  = 'head.csv'

let requestWrap = (file, processor, self) => {
  requestCSV(`data/${file}.csv`, (error, response) => {
    let result = {};
    result[file] = processor(response)

    if (error)
      throw new Error(error)
    else
      self.setState((prev) => _.extend(prev.data, result))
  })
}


let fetchers = {
  trees: (response) => {
    var cat = {
      Good: 1,
      Fair: 2,
      Poor: 3
    }
    return response.map((d) => [(+ d.longitude),
                                (+ d.latitude),
                                0,
                                cat[d.health]
                               ]
                       );
  }
  ,
  crimes: (response) => {
    var cat = {
      MISDEMEANOR: 1,
      VIOLATION: 2,
      FELONY: 3
    }

    return response.map((d) => [(+ d.Longitude),
                         (+ d.Latitude),
                         0,
                                cat[d.LAW_CAT_CD]
                        ]
                );
  }
}


class Map extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: {},
      viewport: {
        longitude: -73.91922208269459,
        latitude: 40.72185277744134,
        zoom: 11.502812637593744,
        maxZoom: 15,
        pitch: 0,
        bearing: 0,
        width: 960,
        height: 500
      }
    };

    let view = this
    _.each(fetchers, (v, k) => { requestWrap(k, v, view) })

  }

    _resize() {
        this._onChangeViewport({
            width: 960,
            height: 500
        });
    }

    _onChangeViewport(viewport) {
        this.setState({
            viewport: _.extend({} ,this.state.viewport, viewport)
        });
    }

    componentDidMount() {
        window.addEventListener('resize', this._resize.bind(this));
        this._resize();
    }

    render() {
      const {viewport, data} = this.state;

      return (
        <MapGL
          {...viewport}
          perspectiveEnabled={true}
          mapStyle="mapbox://styles/mapbox/dark-v9"
          onChangeViewport={this._onChangeViewport.bind(this)}
          mapboxApiAccessToken={MAPBOX_TOKEN}>
          <Overlay
            viewport={viewport}
            data={data}
            radius={30}
            width={960}
            height={500}
          />
        </MapGL>
        );
    }
}

export default Map;
