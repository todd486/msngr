import React from 'react';
import './App.css';
import axios from 'axios';

function App() {
	return (
		<div className="App" >
			<header></header>

			{false && <div className="loading"><svg className="loadingicon" height="100" width="100"><circle cx="50" cy="50" r="40" /></svg></div>}
			<MessageManager />

			<div className='contact' >
				<a aria-label='Contact Me.' title='Contact Me!' className='smallbtn'
					target='_blank' rel="noopener noreferrer" href='https://google.com'>
					<i className='fa fa-question-circle' /></a>
			</div>
		</div>
	);
}

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
		this.reportCallback = this.reportCallback.bind(this);
		this.messageCallback = this.messageCallback.bind(this);
		this.voteCallback = this.voteCallback.bind(this);
		this.var = {
			maxLoadedPosts: 128,
		}
		this.state = {
			reportid: undefined,
			report: false,
			posts: [],
			nopost: true,
			debug: true,
			error: { enable: false, info: 'Sample Error Text!' }
		}
		//maybe let user configure how many posts to allow at once, since it may decrease performance
	}

	componentDidMount() {
		this.timer = setInterval(() => this.refresh(), 1000) //set an interval to refresh the messages every second
		this.fetchToComponent();
	}
	componentWillUnmount() { clearInterval(this.timer) };

	fetchToComponent() {
		fetchData() //promise based fetching
			.then((resolve) => {
				this.sortMessages(resolve.data)
					.then(() => {
						this.setState({ //store the resolved posts in posts state, then sort for date, then pinned status
							nopost: false,
							posts: resolve.data
							//posts: this.state.posts.concat(resolve.data) | note to self: push bad, concat good
						})
					})
					.catch(reject => (
						reject(reject)
					))
			})
			.catch(reject => {
				console.log(reject)
				this.setState({ nopost: true })
			})
	}

	round(x) { //round value to nearest thousand, add k suffix
		return Math.abs(x) > 999 ? Math.sign(x) * ((Math.abs(x) / 1000).toFixed(1)) + 'k' : Math.sign(x) * Math.abs(x)
	}

	refresh() { this.fetchToComponent(); }

	//callbacks from children
	reportCallback() { this.setState({ report: false }) }
	voteCallback() { this.refresh(); }
	messageCallback(state) {
		switch (state) {
			case 0: { //state 0 is success
				this.fetchToComponent(); //fetch new messages
				this.setState({ error: { enable: false, info: '' } })
				break;
			}
			case 1: { //generic send error
				this.setState({ error: { enable: true, info: 'Message failed to send! Try again later...' } })
				break;
			}
			case 2: { //message too short
				this.setState({ error: { enable: true, info: 'Message too short to send!' } })
				break;
			}
			default: { //unknown error
				console.log('Unknown error state returned from messageCallback!')
			}
		}
	}

	sortMessages(data) {
		return new Promise((resolve, reject) => {
			try {
				data.sort((a, b) => b.date - a.date).sort((a, b) => b.pinned - a.pinned);
				resolve();
			} catch (err) { reject(err) }
		})
	}

	/* mapping the data with a key of {index}, display data.content */

	render() { //TODO: implement workers
		return (
			<main>
				{this.state.error.enable ? <div className='error noselect' aria-live='assertive'>
					<button className='smallbtn' aria-label='Close Error Message' onClick={() => {
						this.setState({ error: { enable: false, info: '' } })
					}}><i className='fa fa-close' /></button><div>{this.state.error.info}</div>
				</div> : false}

				{this.state.report ? <Report id={this.state.reportid} callback={this.reportCallback} /> : false}

				<div className='message-container'>
					{this.state.nopost ? <div className='nopost noselect'><span>No posts yet today! Be the first to share something!</span></div> : false}
					{this.state.posts.map((data, index) => (
						<div aria-live='polite' className={'message'} key={index} value={data.postID}>
							<div className='content' value={this.state.debug ? data.id : null}>
								{data.pinned ? <i title="This post has been pinned to the top. It's probably important." className='pinned fa fa-thumb-tack' /> : false}
								{data.content.toString() /* Rendering as toString() for xss reasons */}
								{data.pinned ? false : //if a post is pinned it shouldn't be reportable
									<button
										title='Report this post?' aria-label='Report Post'
										className='smallbtn reportbtn'
										onClick={() => { this.setState({ report: true, reportid: data.id }) }}>
										<i className='fa fa-flag' /></button>}</div>
							<div className='sub-content'>
								<div className='date noselect' title={new Date(data.date).toUTCString()}>{new Date(data.date).toLocaleTimeString()}</div>
								<div className='vote'>
									<button aria-label='Upvote Post' className='smallbtn vote-btn upvote-active noselect'
										onClick={(upvoteevent) => {
											// upvoteevent.currentTarget.value
											sendData('vote', null, data.id, 'upvote')
												.then(() => { this.fetchToComponent(); }) //refresh
										}}><i className='fa fa-chevron-circle-up' /></button>
									<span aria-label='Votes' className='vote-amount noselect' title={data.votes.total}>{this.round(data.votes.total)}</span>
									<button aria-label='Downvote Post' className='smallbtn vote-btn downvote-active noselect'
										onClick={(downvoteevent) => {
											// downvoteevent.currentTarget.value
											sendData('vote', null, data.id, 'downvote')
												.then(() => { this.fetchToComponent(); }) //refresh
										}}><i className='fa fa-chevron-circle-down' /></button>
								</div>
							</div>
						</div>
					))}
				</div>


				<UserText callback={this.messageCallback} />

			</main>
		)
	}
}

//TODO: let user customize types of display to suit their needs:
//compact mode, dark mode / themes in general (save in cookie)



class UserText extends React.Component {
	constructor(props) {
		super(props);
		this.handleSend = this.handleSend.bind(this);
		this.var = {
			maxLength: 128
		}
		this.state = {
			content: '',
			disclaimer: true,
		}
	}

	//TODO: 

	async handleSend() {
		const content = this.state.content;

		//check if total length excluding whitespace is more than 2 char
		if (content.trim().length >= 2) {
			await sendData('post', content)
				.then(() => {
					this.setState({ content: '' });
					this.props.callback(0);
				})
				.catch(reject => {
					console.log(reject);
					this.props.callback(1);
				})
		} else { //show error
			this.props.callback(2);
		}
	}

	onEnterPress = (e) => { if (e.keyCode === 13 && e.shiftKey === false) { e.preventDefault(); this.handleSend(); } }

	render() { //might restructure to be a form for accessibility
		return (
			<div className="chatstuffs" >
				<div className='userArea'>
					<textarea className="userInput noselect" placeholder="Share something!"
						maxLength={this.var.maxLength} value={this.state.content} autoFocus={true}
						aria-label='Message textbox. Press enter to send a message.'
						onChange={(event) => { this.setState({ content: event.target.value, }); }}
						onKeyDown={this.onEnterPress} />

					<button aria-label='Send Message' className='send-message btn send' onClick={this.handleSend}><i className="fa fa-send" /></button>
					{false && <canvas className='limit noselect' width={20} height={20}></canvas> /*TODO: implement limit graphic*/}
				</div>
				{this.state.disclaimer ?
					<footer className='disclaimer'>
						<span>Disclaimer: All posts you make are anonymous, as well as the posts you've interacted with. We remove all posts at midnight (GMT). </span>
						<button aria-label='Close Disclaimer' className='smallbtn' onClick={() => { this.setState({ disclaimer: false }) }}>
							<i className='fa fa-close' /></button></footer> : false}
			</div>
		)
	}
}

class Report extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			content: '',
			error: { enable: false, message: '' }
		}
	}

	close() { this.props.callback(); }
	componentWillUnmount() { this.setState({ content: '' }); }

	render() {
		return (
			<div className='report noselect'>
				<div className='report-title'>
					<span>Report post?</span>
					<button aria-label='Close Report Dialog' className='smallbtn' onClick={() => { this.close(); }}>
						<i className='fa fa-close' /></button>
				</div>

				<span className='noselect'>Please provide a reason for your report. (Max 400 characters)</span>
				<textarea
					aria-label='Report Dialog Textbox'
					maxLength={400} autoFocus={true}
					onChange={(event) => { this.setState({ content: event.target.value }); }}
				/>
				<div className='report-footer'>
					{this.state.error.enable ? <span>
						{this.state.error.message}
					</span> : false}
					<span>post id: {this.props.id}</span>
					<button className='btn'
						value={this.state.content}
						onClick={() => {
							if (this.state.content.length >= 3) {
								sendData('report', this.state.content, this.props.id)
									.then(() => { this.close(); })
									.catch((reject) => { console.log(reject) })
							} else {
								this.setState({ error: { enable: true, message: 'Please enter an appropriate report.' } })
							}
						}}
					>Send report</button>
				</div>
			</div>
		)
	}
}

export default App;