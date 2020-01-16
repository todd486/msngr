import React from 'react';
import './App.css';
// import axios from 'axios';

function App() {
  return (
    <div className="App">
      <div className="main">
        <MessageManager />
        <div className="chatthingy">
          <Textarea />
        </div>
      </div>
    </div>
  );
}

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
  let newPosts = Boolean(Math.round(Math.random()))

  if (userPost !== undefined) {newPosts = true;} 

  //promise to return either resolve or reject
  return new Promise(function(resolve, reject) {
    //implement axios get later
    if (newPosts === true) {
      if (userPost === undefined) {
        resolve([{content: token(8)}])
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

  //set message to next fetch
  userPost = {content: userInput}

  return new Promise(function(resolve, reject) {
    resolve('message sent')
    reject('failed to send')
  })
}

class MessageManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = { posts: [] }
    this.var = { maxLoadedPosts: 128 } //maybe let user configure how many posts to allow at once, since it may decrease performance
  }

  //on component mounting
  componentDidMount() {
    this.timer = setInterval(
      () => this.refresh(), 1000 ) //refresh the messages every 1000 milliseconds

    this.internalFetch()
  }
  componentWillUnmount() { clearInterval(this.timer) }

  componentDidUpdate() {
    //scroll to bottom of chatbox on update
    const objDiv = document.getElementById('message-container');
    objDiv.scrollTop = objDiv.scrollHeight;
  }

  refresh() {
    //Debug console.log(this.state.posts)

    //check if post buffer would be filled
    if ((this.state.posts.length + 1) > this.var.maxLoadedPosts ) {
      console.log('buffer filled, removing first array item')
      this.setState({
        posts: this.state.posts.splice(1) //splice the first post in array out if buffer is filled
      })
    }

    this.internalFetch()
  }

  internalFetch() {
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

  render() {
    return (
      <div className='message-container' id='message-container'>
        {this.state.posts.map((data, index) => (
          <div className='message' key={index}>{data.content}</div>
        ))/* mapping the data with a key of {index}, display data.content */}
      </div>
    )
  }
}

class Textarea extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.state = { messageContent: '' };
    this.var = { maxLength: 128 };
  }

  handleClick() {
    //check for empty or too short message to avoid spam
    //TODO: display error message in a more user friendly way
    if ((this.state.messageContent).trim().length > 3) {
      sendPost(this.state.messageContent)
        .then(resolve => {
          console.log(resolve)
          //clear the textarea if sending was successful
          this.setState({messageContent: ''});
        })
        .catch(reject => {
          console.log(reject)
        })
    } else {
      console.log("no empty messages or message too short")
    }
  }

  onEnterPress = (e) => {
    if(e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault();
      this.handleClick();
    }
  }

  render() {
    return(
      <div className="chatstuffs" >
        <textarea 
        className="userInput" 
        ref="userInputArea" 
        placeholder="share something!" 
        maxLength={this.var.maxLength}

        value={this.state.messageContent} 
        autoFocus={true}
        onChange={(event)=>{
            this.setState({
              messageContent:event.target.value
            });
        }} //onchange update the state to be whatever the user wrote
        onKeyDown={this.onEnterPress} //check for enter presses, send the message if detected
        ></textarea>
        <div className="lengthIndicator"></div>
        <button id="send" onClick={this.handleClick}>Send</button>
      </div>
    )
  }
}

export default App;
