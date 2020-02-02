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
async function fetchData() {
	return new Promise((resolve, reject) => {
		axios.get(`http://localhost:8080?q=posts`)
			.then((response) => {
				if (response.status === 200) {
					//check if response was empty, if so; reject.
					if (response.data.length <= 0) { reject('Response data too short to render!'); }
					else { resolve(response); }

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
		this.state = { posts: [], messageContent: '', debug: false, settingsShown: false, nopost: true }
		this.var = { maxLoadedPosts: 128, maxLength: 128 } //maybe let user configure how many posts to allow at once, since it may decrease performance
	}

	componentDidMount() {
		this.timer = setInterval(() => this.refresh(), 1000) //set an interval to refresh the messages every second
		this.fetchToComponent();
		// this.setState({
		//   posts: this.state.posts.sort((a, b) => b.votes - a.votes)
		// })
	}
	componentWillUnmount() { clearInterval(this.timer) };

	fetchToComponent() {
		fetchData() //promise based fetching
			.then(resolve => {
				this.setState({
					nopost: false, posts: resolve.data
					//posts: this.state.posts.concat(resolve.data) //note to self: push bad, concat good
				})
			})
			.catch(reject => {
				console.log(reject)
				this.setState({ nopost: true })
			})
	}

	refresh() { //this.fetchToComponent(); 
		
	}

	handleClick() { const content = this.state.messageContent;

		if (content.trim().length >= 2) {
			sendData('post', content)
				.then(() => {
					this.setState({ messageContent: '' });
					this.fetchToComponent();
				})
				.catch(reject => { console.log(reject) })
		} else {
			//show error
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

				{false && <div className='options'>
					<span className='logo noselect'>msngr</span>
					<button className='btn' onClick={(event) => {
						if (this.state.settingsShown === false) { this.setState({ settingsShown: true }) }
						else { this.setState({ settingsShown: false }) }
					}}>
						<i className='fa fa-cog' />
					</button>
				</div>}
				{this.state.settingsShown && <div className='options-menu'>
					<h2>Options Menu</h2>
					<div>Max loaded posts</div>
					<div>Show debug info</div>
				</div>}

				<div className='message-container'>
					
					{this.state.nopost && <div className='nopost noselect'><span>No posts yet today! Be the first to share something!</span></div>}

					{this.state.posts.map((data, index) => (
						<div className='message' key={index} value={data.postID}>
							<div className='content'>{data.content}</div>
							<div className='sub-content'>
								<div className='date noselect' title={new Date(data.date).toUTCString()}>{new Date(data.date).toLocaleTimeString()} {this.state.debug && data.id}</div>
								<div className='vote'>
									<span className='vote-btn upvote noselect'>
										<i className='fa fa-chevron-circle-up'
											onClick={(upvoteevent) => {
												console.log(upvoteevent.target);

												sendData('vote', null, data.id, 'upvote'); 
												this.fetchToComponent(); //refresh
											}}
										/></span>
									<span className='vote-amount noselect'>{data.votes}</span>
									<span className='vote-btn downvote noselect'>
										<i className='fa fa-chevron-circle-down'
											onClick={(downvoteevent) => {
												console.log(downvoteevent.target);

												sendData('vote', null, data.id, 'downvote'); 
												this.fetchToComponent(); //refresh
											}}
										/></span>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="chatstuffs" >
					<div className='userArea'>
						<textarea className="userInput" ref="userInputArea" placeholder="Share something!"
							maxLength={this.var.maxLength} value={this.state.messageContent} autoFocus={true}
							onChange={(event) => { this.setState({ messageContent: event.target.value }); }} onKeyDown={this.onEnterPress} />

						<button className='btn' id="send" onClick={this.handleClick}><i className="fa fa-paper-plane" /></button>
						{false && <div className='limit'><svg className="limiticon" height="20" width="20"><circle cx="10" cy="10" r="8" /></svg></div>}
					</div>
				</div>
			</div>
		)
	}
}

export default App;
