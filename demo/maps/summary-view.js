import React, {Component} from 'react';
import vg from 'vega-embed'

let schema = {
  "$schema": "https://vega.github.io/schema/vega-lite/v2.json",
  "data": {"url": "data/crimes.csv","format": {"type": "csv"}},
  "mark": "bar",
  "encoding": {
    "x": {
      "field": "CMPLNT_FR_DT",
      "type": "temporal",
      "timeUnit": "month",
      "axis": {"title": "date"}
    },
    "y": {
      "aggregate": "count",
      "type": "quantitative"
    },
    "color": {
      "field": "LAW_CAT_CD",
      "type": "nominal",
      "scale": {
        "domain": ["FELONY","VIOLATION","MISDEMEANOR"],
        "range": ["#e7ba52","#c7c7c7","#aec7e8"]
      },
      "legend": {"title": "crime type"}
    }
  }
}

class SummaryView extends Component {
  handleClick (e) {
  }


  constructor(props) {
    super(props);

    this.state = {
      chosen: 'trees'
    };
  }

  componentDidMount() {
    vg(".vis", schema, function(error, result) {
      console.log(error, result)
    });
  }



  render() {
    return (
      <div className="vis">

      </div>
    );
  }

}

export default SummaryView;
