import React, {Component} from 'react';

const layers = [
    'trees',
    'crimes',
    'sidewalk_quality',
    /* 'sidewalk cleanliness',
     * 'restaurant inspections',
     * 'electricity consumption',
     * '311 requests',
     * 'rodent inspection (yuck)',
     * 'pollution'*/
]

const exposition = {
    'trees': 'https://www.kaggle.com/keyshin/nyc-trees-a-first-look',
    'crimes': 'https://data.world/data-society/nyc-crime-data',
    'gdelt':'http://www.gdeltproject.org/',
    'sidewalk_quality': 'lol.com'
}

let makeNameGood = (str) => {
    return str.replace('_', ' ')
}

let buildListItems = (selectedIndex) => {
    return layers.map((title, i) =>
        (<li key={title}
            className={selectedIndex == title && 'selected'}
            >
            <a
            onClick={(e) => { e.preventDefault() }}
            href={exposition[title]}
            target="_blank"
            id={title}
            >
            {
                makeNameGood(title)

            }</a>
            </li>)
    )
}

class ListView extends Component {
    constructor(props) {
    super(props);
      this.state = {}
  }

  componentDidMount() {
  }


    render() {
        return (
            <div className="control-panel">
            <h1>Maps of New York City</h1>
            <ul className="legend"
            onClick={this.props.onClick}>
            {buildListItems(this.props.selectedIndex)}
            </ul>
            <p>{this.state.exposition}</p>
            </div>
        );
  }

}

export default ListView;
