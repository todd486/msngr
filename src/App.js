import React from 'react';
import './App.css';
import axios from 'axios';

/*TODO: move error display outside of textarea
  also add logo, settings menu, as well as filtering for posts*/
function App() {
  return (
    <div className="App">
      <div className="main">
        <MessageManager />
        <div className="chatcontainer">
          <Textarea />
        </div>
      </div>
    </div>
  );
}

//generates a token of random characters of a specific length
function token(length) {
  const validChar = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
  let output = '';
  for (let i = 0; i < length; i++) { output += validChar.charAt(Math.floor(Math.random() * validChar.length)) }
  return output;
}

let userPost = undefined;

function fetchPosts() {
  console.log('looking for new messages')

  //randomize if there's a new post (for testing)
  let newPosts = false //Boolean(Math.round(Math.random()))

  if (userPost !== undefined) {newPosts = true;} 

  //TODO: clean up this code, and implement axios
  //promise to return either resolve or reject
  return new Promise(function(resolve, reject) {
    if (newPosts === true) {
      if (userPost === undefined) {
        //resolve([{content: token(8)}]) //posts random string of 8 chars (for testing messaging functionality)
      } else { //add userpost if a new post by the user is detected
        resolve([userPost])
        userPost = undefined;
      }
    } else {
      reject('no new messages')
    }
  })
}

function sendPost(userInput) {
  console.log('attempting to send')

  let success = true //currently always works (for testing message sending failing)
  let currentDate = (new Date().toString())
  let randomVotes = (Math.floor(Math.random() * 10))

  return new Promise(function(resolve, reject) {
    //TODO: implement axios, check for success on message send
    if (success === true) {
      resolve('message sent')
      //set message to next fetch
      //get postID from server later
      userPost = {postID: token(16), content: userInput, votes: randomVotes, userVote: [0,0], date: currentDate}
    } else {
      reject('failed to send')
    }
  })
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
    //set an interval to refresh the messages every 1000 milliseconds

    //fetch new messages on first load
    this.fetchNewToComponent()

    axios.get('http://localhost:8080/init') //initialize user
      .then(response => (
        console.log(response)
      ))
      .catch(error => (
        console.log(error)
      ))
  }
  componentWillUnmount() { clearInterval(this.timer) }

  componentDidUpdate() {
    //autoscroll to bottom of chatbox on update
    const objDiv = document.getElementById('autoscroll');
    objDiv.scrollTop = objDiv.scrollHeight;
  }

  fetchNewToComponent() {
    fetchPosts() //promise based fetching
    .then(resolve => {
      this.setState({
        posts: this.state.posts.concat(resolve) //note to self: push bad, concat good
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

    //fetch new messages
    this.fetchNewToComponent()
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
                  <i className='fa fa-chevron-circle-up' value={false}
                  onClick={(upvoteEvent) => {
                    //check if downvote button is pressed, and invert the vote value afterwards
                    console.log(upvoteEvent.target) /* modify colour of button if pressed */
                    console.log(this.state.posts[index].votes) /* help how do i modify values of objects in state arrays, at least i can display the value */
                  }}
                  /></span>
                <span className='vote-amount'>{data.votes}</span>
                <span className='vote-btn downvote'>
                  <i className='fa fa-chevron-circle-down' value={false}
                  onClick={(downvoteEvent) => {
                    console.log(downvoteEvent.target)
                    console.log(this.state.posts[index].votes)
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
    //TODO: clean up this repetitive code
    if ((this.state.messageContent).trim().length > 3) {
      sendPost(this.state.messageContent)
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
