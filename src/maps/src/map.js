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

d3.request('data/weather.bin')
  .responseType('arraybuffer')
  .on('load', function (req) { parseData(req.response) })
  .on('error', reject)
  .get();

function parseData(buffer) {
    var bufferData = new Uint16Array(buffer);
    var hours = 72;
    var components = 3;
    var l = bufferData.length / (hours * components);
    var hourlyData = Array(hours);

    for (var i = 0; i < hours; ++i) {
      hourlyData[i] = createHourlyData(bufferData, i, l, hours, components);
    }

  return hourlyData;
}


function createHourlyData(bufferData, i, l, hours, components) {
  var len = bufferData.length;
  var array = Array(l);

  for (var j = i * components, count = 0; count < l; j += hours * components) {
    array[count++] = new Float32Array([bufferData[j], bufferData[j + 1], bufferData[j + 2]]);
  }

  return array;
}


function reject(error) {
  console.log('oh butt')
}


let requestWrap = (file, processor, self) => {
  requestCSV(`data/${file}/${file}.csv`, (error, response) => {
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
  },
  bikes: (response) => {
    console.log(response)
    return response.map((d) => [(+ d.Longitude),
                                (+ d.Latitude)
                               ]
                       );
  }
}

console.log(1)

class Map extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: {},
      viewport: {
        longitude: -73.91922208269459,
        latitude: 40.72185277744134,
        zoom: 11.502812637593744,
        pitch: 0,
        bearing: 0,
        width: 960,
        height: 500
      }
    };

    let view = this

    // for (var key in fetchers) {
    //   requestWrap(key, fetchers[key], view)
    // }

    requestWrap('bikes', fetchers['bikes'], view)
  }

    _resize() {
        this._onChangeViewport({
            width: innerWidth,
            height: innerHeight
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
          mapStyle="mapbox://styles/mapbox/light-v9"
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
