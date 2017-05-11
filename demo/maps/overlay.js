import React, {Component} from 'react';
import DeckGL, {ScatterplotLayer} from 'deck.gl';

let colorSchemes = {
    crimes: (d) => {
        let opacity = 255 * .75,
            idx = d[3]

        return {
            1:[0, 0, 255 , opacity],
            2:[125, 0, 125, opacity],
            3:[255, 0, 0, opacity]
        }[idx]
    },
    trees: (d) => {
        return [100, d[3] * 200, 100, 200]
    }
}


let plot = (data, name) => {
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


export default class Overlay extends Component {
  render() {
    const {viewport, width, height, data} = this.props;
      if (! data) return (<div>NO DATA UH OH</div>);
      const layers=  [ plot(data, 'trees'), plot(data, 'crimes')];

      return (
          <DeckGL {...viewport} layers={ layers } />
      )
  }
}
