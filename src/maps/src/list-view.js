import React, {Component} from 'react';

const layers = [
  'trees',
  'crimes',
  'gdelt',
  'brightkite'
]

const exposition = {
    'trees': 'https://www.kaggle.com/keyshin/nyc-trees-a-first-look',
    'crimes': 'https://data.world/data-society/nyc-crime-data',
    'gdelt':'http://www.gdeltproject.org/',
    'brightkite': 'https://snap.stanford.edu/data/loc-brightkite.html'
}

const listItems = layers.map((title, i) =>
    <li key={title}>
    <a href={exposition[title]} target="_blank">{title}</a>
    </li>
);


class ListView extends Component {
  handleClick (e) {
    let chosenLayer = e.target.textContent
    //e.preventDefault()
    this.setState(() => ({ chosenLayer }));
  }


  constructor(props) {
    super(props);

    this.state = {
      chosen: 'trees'
    };
  }

  componentDidMount() {
  }



  render() {
    return (
      <div className="legend">
        <ul onClick={(e) => this.handleClick(e)}>{listItems}</ul>
        <p>{this.state.exposition}</p>
      </div>
    );
  }

}

export default ListView;
