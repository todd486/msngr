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
			<Sidebar />
			{false && <div className="loading"><svg className="loadingicon" height="100" width="100"><circle cx="50" cy="50" r="40" /></svg></div>}
			<MessageManager />
		</div>
	);
}

class Sidebar extends React.Component {
	render() {
		return (
			<div className='sidebar'>
				<div className='sidebar-title noselect'>
					{/* <button className='smallbtn'><i className='fa fa-ellipsis-v' /></button> */}
					<span>msngr</span>
				</div>
				<div className='sidebar-sub'>

				</div>
			</div>
		)
	}
}

//, {httpAgent: new http.Agent({ keepAlive: true })}
async function fetchData() {
	return new Promise((resolve, reject) => {
		axios.get(`http://localhost:8080?q=posts`)
			.then((response) => {
				if (response.status === 200) {
					//check if response.data was empty, if so; reject. since rendering empty objects in react can cause everything to crash
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
	console.log(query+' : '+data+' : '+id+' : '+action)
	switch (query) {
		case 'post': {
			return new Promise((resolve, reject) => {
				axios.post(`http://localhost:8080?q=${query}`, JSON.stringify({ data }))
					.then(response => {
						if (response.status === 200) { //check if a status of 200 was returned on POST
							resolve();
						} else { reject(response); }
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
						} else { reject(response); }
					})
					.catch(error => {
						reject(error)
					})
			})
		}
		case 'report': {
			return new Promise((resolve, reject) => {
				axios.post(`http://localhost:8080?q=${query}?id=${id}`, JSON.stringify({ data }))
					.then(response => {
						if (response.status === 200) { //check if a status of 200 was returned on POST
							resolve();
						} else { reject(response); }
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
		this.handleSend = this.handleSend.bind(this);
		this.var = {
			maxLoadedPosts: 128,
			maxLength: 128,
		}
		this.state = {
			posts: [],
			messageContent: '',
			report_enable: false,
			report_content: '',
			report_id: null,
			nopost: true,
			disclaimer: true,
		}
		//maybe let user configure how many posts to allow at once, since it may decrease performance
	}

	componentDidMount() {
		this.timer = setInterval(() => this.refresh(), 1000) //set an interval to refresh the messages every second
		this.fetchToComponent();
	}
	componentWillUnmount() { clearInterval(this.timer) };

	async fetchToComponent() {
		await fetchData() //promise based fetching
			.then(resolve => {
				this.setState({
					nopost: false, posts: resolve.data
					//posts: this.state.posts.concat(resolve.data) //note to self: push bad, concat good
				})
				this.setState({
					posts: this.state.posts.sort((a, b) => b.date - a.date)
				})
			})
			.catch(reject => {
				console.log(reject)
				this.setState({ nopost: true })
			})
	}

	refresh() { this.fetchToComponent(); }

	async handleSend() {
		const content = this.state.messageContent;

		if (content.trim().length >= 2) {
			await sendData('post', content)
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
			this.handleSend();
		}
	}

	/* mapping the data with a key of {index}, display data.content */

	render() {
		return (
			<div className='main'>

				{this.state.report_enable && <div className='report noselect'>
					<div className='report-title'>Report post?</div>
					<p>Please provide a reason for your report. (Max 400 characters)</p>
					<textarea
						maxLength={400} autoFocus={true}
						onChange={(event) => {
							this.setState({
								report_content: event.target.value
							});
						}}
						
					/>
					<div className='report-footer'>
						<span>post id: {this.state.report_id}</span>
						<button className='btn' 
						value={this.state.report_content}
						onClick={() => {
							this.setState({
								report_enable: false
							})
							
							sendData('report', this.state.report_content, this.state.report_id, undefined)
							.then(() => {
								this.setState({
									report_content: ''
								})
							})
							.catch ((reject) => {
								console.log(reject)
							})
						}}
						>Send report</button>
					</div>
				</div>}

				<div className='message-container'>

					{this.state.nopost && <div className='nopost noselect'><span>No posts yet today! Be the first to share something!</span></div>}

					{this.state.posts.map((data, index) => (
						<div className='message' key={index} value={data.postID}>
							<div className='content'>{data.content}<button
								title='Report this post?'
								className='smallbtn reportbtn'
								onClick={() => {
									const id = data.id
									this.setState({ report_id: id, report_enable: true })
								}}
							>
								<i className='fa fa-flag' /></button></div>
							<div className='sub-content'>
								<div className='date noselect' title={new Date(data.date).toUTCString()}>{new Date(data.date).toLocaleTimeString()} {this.state.debug && data.id}</div>
								<div className='vote'>
									<span className='vote-btn upvote noselect'>
										<i className='fa fa-chevron-circle-up'
											onClick={(upvoteevent) => {

												sendData('vote', null, data.id, 'upvote');
												this.fetchToComponent(); //refresh
											}}
										/></span>
									<span className='vote-amount noselect'>{data.votes.total}</span>
									<span className='vote-btn downvote noselect'>
										<i className='fa fa-chevron-circle-down'
											onClick={(downvoteevent) => {

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
							onChange={(event) => {
								this.setState({
									messageContent: event.target.value,
								});
							}}
							onKeyDown={this.onEnterPress} />

						<button className='btn send' onClick={this.handleSend}><i className="fa fa-send" /></button>
						{false && <canvas className='limit noselect' width={20} height={20}></canvas>}
					</div>
					{this.state.disclaimer && <div className='dis'><p>Disclaimer: All posts you make are anonymous, as well as the posts you've interacted with. We remove all posts at midnight (CET). </p>
						<button className='smallbtn'><i className='fa fa-close' onClick={() => { this.setState({ disclaimer: false }) }} /></button></div>}

				</div>
			</div>
		)
	}
}

export default App;