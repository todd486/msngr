import React from 'react';
import './App.css';
import axios from 'axios';

/*TODO: move error display outside of textarea
  also add logo, settings menu, as well as filtering for posts*/

//set if loading animation should display

function App() {
  return (
    <div className="App">
      {false && <div className="loading"><svg className="loadingicon" height="100" width="100"><circle cx="50" cy="50" r="40" /></svg></div>}
      <div className="main">
        <MessageManager />
        <div className="chatcontainer">
          <Textarea />
        </div>
      </div>
    </div>
  );
}

function fetchPosts(query) {
  console.log('looking for new messages')

  switch(query) {
    case 'top' : {
      return new Promise((resolve, reject) => {
        axios.get(`http://localhost:8080?q=get${query}`)
          .then(response => {
            console.log(response)
            resolve(response)
          })
          .catch(error => {
            reject(error)
          })
      })
    }
    case 'new' : {
      return new Promise((resolve, reject) => {
        axios.get(`http://localhost:8080?q=get${query}`)
          .then(response => {
            console.log(response)
            resolve(response)
          })
          .catch(error => {
            reject(error)
          })
      })
    }
    default : {
      console.log('malformed internal get request')
    }
  }
}

function sendData(query, data, postID, action) {
  console.log('attempting to send')

  switch(query) {
    case 'send' : {
      return new Promise((resolve, reject) => {
        axios.post(`http://localhost:8080?q=${query}`, data)
          .then(response => {
            resolve(response) //TODO: figure out how to send data
          })
          .catch(error => {
            reject(error)
          }) //might be able to move .then & .catch outside of case, might fall outside scope
      })
    }
    case 'vote' : {
      return new Promise((resolve, reject) => {
        axios.post(`http://localhost:8080?q=${query}&?postID=${postID}&?v=${action}`)
          .then(response => {
            resolve(response)
          })
          .catch(error => {
            reject(error)
          })
      })
    }
    default : {
      console.log('malformed internal post request')
    }
  }
}

class MessageManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = { posts: [] }
    this.var = { maxLoadedPosts: 128 } //maybe let user configure how many posts to allow at once, since it may decrease performance
  }

  componentDidMount() {
    this.timer = setInterval(
      () => this.refresh(), 1000 )
    //set an interval to refresh the messages every second

    const initialize = () => {
      axios.get('http://localhost:8080?q=init') //initialize user
      .then(response => (
        console.log(response),
        //fetch new messages on first load
        this.fetchToComponent('top')
      ))
      .catch(error => (
        console.log(error),
        //check every 5 seconds to see if connection to server can be made to init user
        //TODO: display error to user
        setTimeout(initialize(), 5000)
      ))
      .finally(
        //set the loading screen not to be visible
      )
    }

    initialize()
  }
  componentWillUnmount() { clearInterval(this.timer) }

  componentDidUpdate() {
    //autoscroll to bottom of chatbox on update
    const objDiv = document.getElementById('autoscroll');
    objDiv.scrollTop = objDiv.scrollHeight;
  }

  fetchToComponent(query) {
    fetchPosts(query) //promise based fetching
    .then(resolve => {
      this.setState({
        posts: this.state.posts.concat(resolve.data) //note to self: push bad, concat good
        //concat the resolved data
        //TODO: implement check for loading all or single message
      })
    })
    .catch(reject => {
      console.log(reject)
    })
  }

  refresh() {
    //check if post buffer would be filled
    if ((this.state.posts.length + 1) > this.var.maxLoadedPosts ) {
      console.log('buffer filled, removing first array item')
      this.setState({
        posts: this.state.posts.splice(1) //splice the first post in array out if buffer is filled
      })
    }
  }

  /* mapping the data with a key of {index}, display data.content */
  /* TODO: make the user able to vote on posts */
  render() {
    return (
      <div className='message-container' id='autoscroll'>
        {this.state.posts.map((data, index) => (
          <div className='message' key={index} value={data.postID}>
            <div className='content'>{data.content}</div>
            <div className='sub-content'>
              <div className='tooltip date'>{data.date}</div>
              <div className='vote'>
                <span className='vote-btn upvote'>
                  <i className='fa fa-chevron-circle-up' 
                  onClick={(upvoteEvent) => {
                    //check if downvote button is pressed, and invert the vote value afterwards
                    //console.log(upvoteEvent.target) /* modify colour of button if pressed */
                    //console.log(this.state.posts[index].votes) /* help how do i modify values of objects in state arrays, at least i can display the value */

                    sendData('vote', null, data.postID, 'upvote')
                  }}
                  /></span>
                <span className='vote-amount'>{data.votes}</span>
                <span className='vote-btn downvote'>
                  <i className='fa fa-chevron-circle-down' 
                  onClick={(downvoteEvent) => {
                    //console.log(downvoteEvent.target)
                    //console.log(this.state.posts[index].votes)

                    sendData('vote', null, data.postID, 'downvote')
                    //call refresh on data once upvote has been acknoledged
                  }}
                  /></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
}

class Textarea extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.state = { messageContent: '', errorState: '', errorVisible: false };
    this.var = { maxLength: 128 };
  }

  handleClick() {
    //check for empty or too short message to avoid spam
    //TODO: clean up this disgusting code
    if ((this.state.messageContent).trim().length > 3) {
      sendData('send', [this.state.messageContent])
        .then(resolve => {
          console.log(resolve)
          //clear the textarea if sending was successful
          this.setState({messageContent: ''});
          this.setState({errorVisible: false})
        })
        .catch(reject => {
          this.setState({errorState: reject})
          this.setState({errorVisible: true})
        })
    } else {
      this.setState({errorState: 'message too short or blank'})
      this.setState({errorVisible: true})
    }
  }

  //TODO: change this into something that i actually understand how it works
  onEnterPress = (e) => {
    if(e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault();
      this.handleClick();
    }
  }

  render() {
    return(
      <div className="chatstuffs" >
        <div className='userArea'>

        <textarea 
        /* main parameters */
        className="userInput" 
        ref="userInputArea" 
        placeholder="share something!" 
        maxLength={this.var.maxLength}

        /* stuff relevant to render update */
        value={this.state.messageContent} 
        autoFocus={true}
        onChange={(event)=>{
            this.setState({
              messageContent: event.target.value
            });
        }} //onchange update the state to be whatever the user wrote
        onKeyDown={this.onEnterPress} //check for enter presses, send the message if detected
        />

        <button id="send" onClick={this.handleClick}><i className="fa fa-paper-plane" /></button>
        </div>

        {this.state.errorVisible && <div className="error">Error: {this.state.errorState}</div> /* rendering an element as false && <element> will make it not visible */}
      </div>
    )
  }
}

export default App;
