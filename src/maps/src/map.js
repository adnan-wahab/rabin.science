import React, {Component} from 'react';
import MapGL from 'react-map-gl';
import DeckGL, {ScatterplotLayer} from 'deck.gl';
import * as d3 from 'd3';
import _ from 'underscore';
import Overlay from './overlay.js';

import {csv as requestCSV} from 'd3-request';
import {json as requestJSON} from 'd3-request';

// Set your mapbox token here
var MAPBOX_TOKEN = 'pk.eyJ1IjoiYXdhaGFiIiwiYSI6ImNpenExZHF0ZTAxMXYzMm40cWRxZXY1d3IifQ.TdYuekJQSG1eh6dDpywTxQ';



let done = (results) => {
  let data = {}

  data.trees = results[0]
  data.crimes = results[1]

  processors.trees(data)
  processors.crimes(data)

  return data
}
function loadData() {
  return Promise.all([load('/data/trees/trees.csv'),
                      load('/data/crimes/crimes.csv')
                     ])
    .then(done);
}


let load = (url) => {
  return new Promise((resolve, reject) => {
    let fetch = (url.split('.')[1] == 'json' ? requestJSON : requestCSV)

    fetch(url)
      .on('load', resolve)
      .on('error', reject)
      .get();
  });
}


let processors = {
  trees: (data) => {
    var cat = {
      Good: 1,
      Fair: 2,
      Poor: 3
    }

    data.trees = data.trees.map((d) => [(+ d.longitude),
                                             (+ d.latitude),
                                             0,
                                             cat[d.health]
                                            ]
                                    );
  },
  crimes: (data) => {
    var cat = {
      MISDEMEANOR: 1,
      VIOLATION: 2,
      FELONY: 3
    }
    data.crimes = data.crimes.map((d) => [(+ d.Longitude),
                                (+ d.Latitude),
                                0,
                                cat[d.LAW_CAT_CD]
                               ]
                       );
  },
  bike_stations: (results) => {
    let beanList = results[0].bike_stations
    let stations = {}
    for (let bean of beanList) stations[bean.id] = bean

    result.bike_stations = stations
  },
  bike_trips: (results) => {
    let shadow= [ 40.75668720603179, -73.98257732391357 ]

    let trips = results.bike_trips.map((row, n) => {
      let source = results.stations[row['start station id']],
          target = resultsstations[row['end station id']]

      return [
        [source ? source.longitude : shadow[1],
         source ? source.latitude : shadow[0]
        ],
        [target ? target.longitude : shadow[1],
         target ? target.latitude : shadow[0]
        ]
      ]
    })


    data.bike_trips = trips
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
        pitch: 0,
        bearing: 0,
        width: 960,
        height: 500
      }
    };

    let view = this

    loadData().then((data) => {
      console.log(data)
      this.setState({data: data})
    })
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
