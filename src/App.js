import React from 'react';
import './App.css';
import axios from 'axios';
//import http from 'http';
// import Agent from 'agentkeepalive';

/*TODO: move error display outside of textarea
  also add logo, settings menu, as well as filtering for posts*/

//set if loading animation should display

// const keepaliveAgent = new Agent({
//   maxSockets: 100,
//   maxFreeSockets: 10,
//   timeout: 60000, //active socket keepalive for 60 seconds
//   freeSocketTimeout: 30000, //free socket keepalive for 30 seconds
// });
// const options = {
//   host: 'localhost',
//   port: 8080,
//   path: '/',
//   method: 'GET',
//   agent: keepaliveAgent,
// };

function App() {
  return (
    <div className="App">
      {false && <div className="loading"><svg className="loadingicon" height="100" width="100"><circle cx="50" cy="50" r="40" /></svg></div>}
      <MessageManager />
    </div>
  );
}
//, {httpAgent: new http.Agent({ keepAlive: true })}
async function fetchPosts() {
  return new Promise((resolve, reject) => {
    axios.get('http://localhost:8080?q=getposts')
      .then((response) => {
        if (response.status === 200) {
          resolve(response);
        } else { reject(); }
      })
      .catch((error) => {
        reject(error);
      })
  })
}

async function sendData(query, data, id, action) {
  switch (query) {
    case 'post': {
      return new Promise((resolve, reject) => {
        axios.post(`http://localhost:8080?q=${query}`, JSON.stringify({ data }))
          .then(response => {
            if (response.status === 200) { //check if a status of 200 was returned on POST
              resolve();
            } else { reject(); }
          })
          .catch(error => {
            console.log(error)
          })
      })
    }
    case 'vote': {
      return new Promise((resolve, reject) => {
        //TODO: send post id as well as user id in query as data. verfiy user id serverside
        axios.post(`http://localhost:8080?q=${query}?id=${id}?v=${action}`)
          .then(response => {
            if (response.status === 200) { //check if a status of 200 was returned on POST
              resolve();
            } else { reject(); }
          })
          .catch(error => {
            reject(error)
          })
      })
    }
    default: { console.log('malformed internal post request') }
  }
}

class MessageManager extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.state = { posts: [], messageContent: '', errorState: '', errorVisible: false, debug: false, settingsShown: false, }
    this.var = { maxLoadedPosts: 128, maxLength: 128 } //maybe let user configure how many posts to allow at once, since it may decrease performance
  }

  componentDidMount() {
    this.timer = setInterval(() => this.refresh(), 5000) //set an interval to refresh the messages every second
    this.fetchToComponent();
    // this.setState({
    //   posts: this.state.posts.sort((a, b) => b.votes - a.votes)
    // })
  }
  componentWillUnmount() { clearInterval(this.timer) };

  fetchToComponent() {
    // if (this.state.maxLoadedPosts > 128) {
    //   this.setState({
    //     posts: this.state.posts.splice(0, )
    //   })
    // }
    fetchPosts() //promise based fetching
      .then(resolve => {
        this.setState({
          posts: resolve.data //note to self: push bad, concat good
          //posts: this.state.posts.concat(resolve.data)
        })
      })
      .catch(reject => {
        console.log(reject)
      })
  }

  refresh() { 
    //this.fetchToComponent(); 
  }

  handleClick() {
    const content = this.state.messageContent;
    if (content.trim().length >= 2) {
      sendData('post', content)
      .then(() => {
        this.setState({ messageContent: '' });
        this.fetchToComponent();
      })
      .catch(reject => {
        console.log(reject)
      })
    }
  } 

  onEnterPress = (e) => {
    if (e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault();
      this.handleClick();
    }
  }

  /* mapping the data with a key of {index}, display data.content */
  
  render() {
    return (
      <div className='main'>

        <div className='options'>
          <span className='logo noselect'>msngr</span>
          <button className='btn' onClick={(event) => { 
            if (this.state.settingsShown === false) { this.setState({settingsShown: true}) } 
            else { this.setState({settingsShown: false}) } }}>
            <i className='fa fa-cog' />
          </button>
        </div>
        {this.state.settingsShown && <div className='options-menu'>
            <h2>Options Menu</h2>
            <div>Max loaded posts</div>
            <div>Show debug info</div>
        </div>}

        <div className='message-container'>
          {this.state.posts.map((data, index) => (
            <div className='message' key={index} value={data.postID}>
              <div className='content'>{data.content}</div>
              <div className='sub-content'>
                <div className='date noselect'>{new Date(data.date).toLocaleTimeString()} {this.state.debug && data.id}</div>
                <div className='vote'>
                  <span className='vote-btn upvote'>
                    <i value={false} className='fa fa-chevron-circle-up'
                      onClick={(upvoteevent) => {
                        console.log(upvoteevent.target)
                        console.log(upvoteevent.target.value)
                        // if (upvoteevent.target.value) {
                        //   upvoteevent.target.style = 'color: rgb(94,189,255)';
                        // }

                        sendData('vote', null, data.id, 'upvote');
                        this.fetchToComponent();
                      }}
                    /></span>
                  <span className='vote-amount noselect'>{data.votes}</span>
                  <span className='vote-btn downvote'>
                    <i value={false} className='fa fa-chevron-circle-down'
                      onClick={(downvoteevent) => {
                        console.log(downvoteevent.target)

                        sendData('vote', null, data.id, 'downvote');
                        this.fetchToComponent();
                      }}
                    /></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="chatstuffs" >
          <div className='userArea'>
            <textarea
              /* main parameters */
              className="userInput"
              ref="userInputArea"
              placeholder="Share something!"
              maxLength={this.var.maxLength}

              /* stuff relevant to render update */
              value={this.state.messageContent}
              autoFocus={true}
              onChange={(event) => {
                this.setState({
                  messageContent: event.target.value
                });
              }} //onchange update the state to be whatever the user wrote
              onKeyDown={this.onEnterPress} //check for enter presses, send the message if detected
            ></textarea>

            <button className='btn' id="send" onClick={this.handleClick}><i className="fa fa-paper-plane" /></button>
            {false && <div className='limit'><svg className="limiticon" height="20" width="20"><circle cx="10" cy="10" r="8" /></svg></div>/* rendering as false for now*/}
          </div>

          {this.state.errorVisible && <div className="error">Error: {this.state.errorState}</div> /* rendering an element as false && <element> will make it not visible */}
        </div>

      </div>
    )
  }
}

export default App;
