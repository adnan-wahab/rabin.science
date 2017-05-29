import React, {Component} from 'react';
import MapGL from 'react-map-gl';
import DeckGL, {ScatterplotLayer} from 'deck.gl';
import * as d3 from 'd3';
import _ from 'underscore';
import Overlay from './overlay.js';

import {text as request} from 'd3-request';
import {csv as requestCSV} from 'd3-request';
import {json as requestJSON} from 'd3-request';

// Set your mapbox token here
var MAPBOX_TOKEN = 'pk.eyJ1IjoiYXdhaGFiIiwiYSI6ImNpenExZHF0ZTAxMXYzMm40cWRxZXY1d3IifQ.TdYuekJQSG1eh6dDpywTxQ';

let done = (results) => {
  let beanList = results[0].stationBeanList
  let stations = {}
  for (let bean of beanList) stations[bean.id] = bean

  let shadow= [ 40.75668720603179, -73.98257732391357 ]

  let trips = results[1].map((row, n) => {
    let source = stations[row['start station id']],
        target = stations[row['end station id']]

        //return [shit[n].start, shit[n].end]

    return [
      [source ? source.longitude : shadow[1],
       source ? source.latitude : shadow[0]
      ],
      [target ? target.longitude : shadow[1],
       target ? target.latitude : shadow[0]
      ]
    ]
  })

  return {
    stations: stations,
    bike_trips: trips
  }
}

function loadData() {
  return Promise.all([loadStations(), loadTrips()]).then(done);
}


let loadStations = () => {
  return new Promise((resolve, reject) => {
    requestJSON('data/citi_bike/stations.json')
      .on('load', resolve)
      .on('error', reject)
      .get();
  });
}
let loadTrips = () => {
  return new Promise((resolve, reject) => {
    requestCSV('data/citi_bike/trips.csv')
      .on('load', resolve)
      .on('error', reject)
      .get();
  });
}

// let requestWrap = (file, processor, self) => {
//   requestCSV(`data/${file}/${file}.csv`, (error, response) => {
//     let result = {};
//     result[file] = processor(response)

//     if (error)
//       throw new Error(error)
//     else
//       self.setState((prev) => _.extend(prev.data, result))
//   })
// }




let processors = {
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
    return response.map((d) => [(+ d.Longitude),
                                (+ d.Latitude)
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
        pitch: 0,
        bearing: 0,
        width: 960,
        height: 500
      }
    };

    let view = this

    loadData().then((data) => {
      this.setState({data})
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
