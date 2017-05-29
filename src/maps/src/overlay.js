

import React, {Component} from 'react';
import DeckGL, {ScatterplotLayer} from 'deck.gl';

import {LineLayer} from 'deck.gl'

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
      const {viewport, width, height, data} = this.props;
      if (! data) return null;

      const layers=  [
        scatter(data, 'trees'), scatter(data, 'crimes')
      ];

        // const layers = [
        //     lines(data.bike_trips)
        // ]

        return (
            <DeckGL {...viewport} layers={ layers } />
        )
  }
}
