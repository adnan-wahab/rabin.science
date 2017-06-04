import React, {Component} from 'react';
import DeckGL, {ScatterplotLayer, GeoJsonLayer} from 'deck.gl';

import {LineLayer} from 'deck.gl'

import * as d3 from 'd3'
window.d3 = d3


let nyc = [
    -73.91922208269459,
    40.72185277744134
]

const LIGHT_SETTINGS = {
    lightsPosition: [nyc[0], nyc[1], 5000, nyc[0], nyc[1], 8000],
    ambientRatio: 1.,
    diffuseRatio: 1.,
    specularRatio: 1.,
    lightsStrength: [1.0, 1.0, 1.0, 1.0],
    numberOfLights: 2
};

let colorSchemes = {
    crimes: (d) => {
        let opacity = 255,
            idx = d[3]

        return {
            1:[0, 0, 255 , opacity],
            2:[200, 0, 200, opacity],
            3:[255, 0, 0, opacity]
        }[idx]
    },
    trees: (d) => {
        return [100, d[3] * 200, 100, 255]
    },

    bikes: (d) => {
        return [100, d[3] * 200, 100, 255]
    },
    streetRatings: (d) => {


    }
}

let geoJson = (data) => {
    let words = {
        'GOOD': d3.rgb('pink'),
        'FAIR': d3.rgb('purple'),
        'BAD': d3.rgb('red'),
        'POOR': d3.rgb('blue'),
        'NR': d3.rgb('white')
    }

    let sidewalkQuality =  f => {
        let val = words[f.properties.rating_word]
        return [val.r, val.g, val.b]
    }
    return new GeoJsonLayer({
        id: 'geojson',
        data,
        opacity: 0.8,
        stroked: true,
        filled: true,
        extruded: true,
        wireframe: true,
        fp64: true,
        getFillColor: sidewalkQuality,
        getLineColor: sidewalkQuality,
        lightSettings: LIGHT_SETTINGS,
        lineWidthScale: 10,
    });
}

let scatter = (data, name) => {
    return new ScatterplotLayer({
        id: name,
        getPosition: (d) => d.slice(0,3),
        getColor: d => colorSchemes[name](d),
        radiusScale: 5,
        getRadius: d => 5,
        data: data[name],
        outline: false,
        /* pickable: true,
         * onHover: info => console.log('Hovered:', info),
         * onClick: info => console.log('Clicked:', info)*/
    })
}

let lines = (data) => {
    return new LineLayer({
        id: 'flight-paths',
        data: data,
        strokeWidth: 1    ,
        fp64: false,
        getSourcePosition: d => d[0],
        getTargetPosition: d => d[1],
        getColor: () => [255,0,0,100]
    })
}


export default class Overlay extends Component {
    render() {
        const {viewport, width, height, data, selectedIndex} = this.props;
        if (! data) return null;

        const layers=  [
            scatter(data, 'trees'),
            scatter(data, 'crimes'),
            geoJson(data, 'streetRatings')
        ].filter((d) => {
            return d.id === selectedIndex
        })

        return (
            <DeckGL {...viewport} layers={ layers } />
        )
  }
}
