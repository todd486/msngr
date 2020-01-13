import React from 'react';
import './App.css';
import axios from 'axios';

function App() {
  return (
    <div className="App">
      <div className="main">
        <div className="messagebox">
          <div className="message">
            <div className="username">anonymous turtle</div>
            <p className="content">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
          </div>
          <div className="message">
            <div className="username">anonymous peacock</div>
            <p className="content">Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>
          </div>
          <div className="message">
            <div className="username">anonymous koala</div>
            <p className="content">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          </div>
          <div className="message">
            <div className="username">anonymous ant</div>
            <p className="content">Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>
          </div>
          <div className="message">
            <div className="username">anonymous zebra</div>
            <p className="content">Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>
          </div>
          <div className="message">
            <div className="username">anonymous rabbit</div>
            <p className="content">Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>
          </div>
          <div className="message">
            <div className="username">anonymous alligator</div>
            <p className="content">Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>
          </div>
          <div className="message">
            <div className="username">anonymous cat</div>
            <p className="content">Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>
          </div>

        </div>
        <div className="chatthingy">
          <MessageHandler />
        </div>
      </div>
    </div>
  );
}

function Token() {
  return (Math.floor(100000 + Math.random() * 900000))
}

class MessageHandler extends React.Component {
  constructor(props) {
    super(props);
    this.handleSend = this.handleSend.bind(this);
    this.state = { messageContent: '', sessionToken: ''};
    this.var = { maxLength: 128};
  }

  //on component mounting
  componentDidMount() {
    this.timer = setInterval(
      () => this.refresh(), 10000 ) //refresh the messages every 10 seconds

    //give the user a session token, randomized each session
    this.setState({sessionToken: 'asasa'})

    console.log(this.state.sessionToken)
  }
  componentWillUnmount() { clearInterval(this.timer) }

  //declare what should happen during a message refresh
  refresh() {
    console.log('checking for new messages')
    //declare which adress it should fetch from
    // axios.get('https://dog.ceo/api/breeds/image/random')
    // .then(response => {
    //   console.log(response.data);
    // })
    // .catch(error => {
    //   console.log(error);
    // });
  }

  handleSend() {
    //check for empty message
    if ((this.state.messageContent).trim().length > 3) {
      console.log("sending!")
      console.log(this.state.messageContent)
      //clear the textarea if sending was successful
      this.setState({messageContent: ''});
    } else {
      console.log("didn't send! no empty messages or message too short")
    }
    //make sure user input is always treated as a string, to avoid xss exploits
    //create an object containing what the user wrote
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
        }}
        ></textarea>
        <div className="lengthIndicator"></div>
        <button id="send" onClick={this.handleSend}>Send</button>
      </div>
    )
  }
}

export default App;
