import React, {Component} from 'react';

const implemented = [
    true,
    true,
    false
]

const layers = [
    'trees',
    'crimes',
    'gdelt',
]

const exposition = {
    'trees': 'https://www.kaggle.com/keyshin/nyc-trees-a-first-look',
    'crimes': 'https://data.world/data-society/nyc-crime-data',
    'gdelt':'http://www.gdeltproject.org/',
}

const listItems = layers.map((title, i) =>
    implemented[i] ?
           (<li key={title}>
               <a href={exposition[title]} target="_blank">{title}</a>
               </li>)
          :
           (<strike><li>{title}</li></strike>)
)

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
        <div className="control-panel">
        <h1>Maps of New York City</h1>
        <ul onClick={(e) => this.handleClick(e)}>{listItems}</ul>
        <p>{this.state.exposition}</p>
      </div>
    );
  }

}

export default ListView;
