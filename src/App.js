import React from 'react';
import './App.css';
import './fontawesome.css';
import axios from 'axios';

async function fetchData() {
	return new Promise((resolve, reject) => {
		axios.get(`https://msngr.now.sh/api/server.ts?q=posts`)
			.then((response) => {
				resolve(response);
			})
			.catch((error) => {
				reject(error);
			})
	})
}
async function sendData(data) {
	return new Promise((resolve, reject) => {
		axios.post(`https://msngr.now.sh/api/server.ts?q=post`, { data })
			.then(response => {
				resolve(response);
			})
			.catch(error => {
				reject(error);
			})
		})
}

function App() {
	return (
		<div className="App" >
			<AppContainer />
		</div>
	);
}

class AppContainer extends React.Component {
	constructor(props) {
		super(props);
		this.connError = this.connError.bind(this);
		this.state = { 
			loading: true,
			loadingError: true,
			connAttempt: 0,
			showMenu: false,
			about: false,
			settings: { //Defaults
				profanity: true,
				compact: false,
				max_post: 128,
			} //TODO: make settings take effect
		}
	}

	componentDidMount() { this.connCheck() }
	componentWillUnmount() { clearInterval(this.timer); }
	connError() {
		this.setState({ loading: true, loadingError: true })
		this.timer = setInterval(() => this.connCheck(), 1000)
	}
	connCheck() {
		fetchData()
			.then(() => {
				this.setState({
					loading: false,
					loadingError: false,
					connAttempt: 0,
				})
			})
			.catch((reject) => {
				this.setState({ connAttempt: this.state.connAttempt + 1 })
				this.connCheck()
				console.log(reject)
			})
	}

	render() {
		return (
			<div className='AppContainer'>
				{this.state.loading ? <div className="loading"><svg className="loading_icon" height="100" width="100"><circle cx="50" cy="50" r="40" /></svg></div> : false}

				<header>
					<img className='logo' src='favicon.ico' alt='msngr logo' title='msngr logo' />
					<span className='no_select'>msngr</span>
					<aside>
						<a aria-label='Contact Me' title='Contact Me' className='small_btn'
							target='_blank' rel="noopener noreferrer" href='mailto:filip.svahn@elev.ga.ntig.se'>
							<i className='fa fa-envelope' /></a>
						<a aria-label='GitHub Repository for msngr' title='GitHub' className='small_btn'
							target='_blank' rel="noopener noreferrer" href='https://github.com/todd486/msngr'
						><i className='fa fa-github' /></a>
						<button aria-label='About this web-app' title='About' className='small_btn'
							onClick={() => {
								this.setState({ showMenu: !this.state.about ? true : !this.state.showMenu, about: true, })
							}}><i className='fa fa-question-circle' /></button>
						<button aria-label='Change Settings' title='Settings' className='small_btn'
							onClick={() => {
								this.setState({ showMenu: this.state.about ? true : !this.state.showMenu, about: false, })
							}}><i className='fa fa-cog' /></button>
					</aside>
				</header>

				{this.state.showMenu ? <div className='menu'>
					{this.state.about ?
						<article className='submenu'>
							{/* About section */}
							<h1>About msngr</h1>
							<p>msngr, <i>(pronounced 'Messenger')</i> is an anonymous, open-source public messaging service; where messages have a lifespan of only 10 seconds! It's free for anyone to use and communicate freely upon.</p>
							<p>Created as a school project for my web development course in the span of a little more than a month, it is not intended to be a serious method of communication, rather a silly experiment to see what happens when you give people a voice free from the bounds of reality, and letting the masses decide what should stay on the front page for the day.</p>
							<p>I hope that people can enjoy my little creation and share their thoughts on it.</p>
							<h2>Privacy Policy and GDPR info</h2>
							<p>In order to comply with the General Data Protection Regulations put in place by the European Union, none of the posts made to msngr contain any personally identifying information, aside from the IP address used to connect to our servers, which is kept securely inaccessible from the public.</p>
							<p>Though data which is sent on msngr is encrypted with SSL provided by Zeit, so I strongly advice against sending any form of sensitive information on msngr.</p>

							<footer>&copy; Isabelle Svahn, 2020</footer>
						</article> : <article className='submenu'>
							{/* Settings section */}
							<h1>Settings</h1>
							<h2>Post settings</h2>
							<span>
								<button className={this.state.settings.profanity ? 'small_btn toggle_btn-on toggle_btn' : 'small_btn toggle_btn'} aria-label='Toggle Button' onClick={() => {
									const x = Object.assign(this.state.settings); //pull the entire object from state
									x.profanity = !this.state.settings.profanity; //reassign the specified value
									this.setState({ x }); //set the state back
									//laggy for unknown reasons when condensed into this.setState(() => {Object.assign(this.state.settings).profanity = !this.state.settings.profanity});
								}}>{this.state.settings.profanity ? <i className='fa fa-toggle-on' /> : <i className='fa fa-toggle-off' />}</button>
								<label>Show Profanity</label>
							</span>
							<span>
								<input value={this.state.settings.max_post} type='text'
									onChange={(event) => {
										const x = Object.assign(this.state.settings);
										x.max_post = event.target.value;
										this.setState({ x });
									}}
									onBlur={() => { //onBlur: called on object losing focus
										let y = Number(this.state.settings.max_post)
										if (isNaN(y) || (y < 64 || y > 1024)) { //check if y, is less than 64, greater than 1024 and is a number
											const x = Object.assign(this.state.settings);
											x.max_post = 128; //default
											this.setState({ x });
										}
									}}></input>
								<label>Max amount of posts to load</label>
							</span>
							<h2>Layout</h2>
							<span>
								<button className={this.state.settings.compact ? 'small_btn toggle_btn-on toggle_btn' : 'small_btn toggle_btn'} aria-label='Toggle Button' onClick={() => {
									const x = Object.assign(this.state.settings);
									x.compact = !this.state.settings.compact;
									this.setState({ x });
								}}>{this.state.settings.compact ? <i className='fa fa-toggle-on' /> : <i className='fa fa-toggle-off' />}</button>
								<label>Compact Mode</label>
							</span>
						</article>}
				</div> : this.state.loadingError ?
						<span className='conn' aria-live='assertive'>Could not connect to msngr servers! Attempt: {this.state.connAttempt}</span> :
						<MessageManager settings={this.state.settings} connError={this.connError} />
				}
			</div>
		)
	}
}

class MessageManager extends React.Component {
	constructor(props) {
		super(props);
		this.reportCallback = this.reportCallback.bind(this);
		this.messageCallback = this.messageCallback.bind(this);
		this.voteCallback = this.voteCallback.bind(this);
		this.state = {
			settings: this.props.settings,
			posts: [],
			error: { enable: false, info: "You're a curious one, you're not supposed to see this!" }
		}
		//maybe let user configure how many posts to allow at once, since it may decrease performance
	}

	componentDidMount() {
		this.timer = setInterval(() => this.refresh(), 1000) //set an interval to refresh the messages every second
		this.fetchToComponent();
	}
	componentWillUnmount() { clearInterval(this.timer); };

	async fetchToComponent() {
		await fetchData() //promise based fetching
			.then((resolve) => {
				function sortedPosts(input) {
					return input
						.sort((a, b) => b.date - a.date);
				}
				if (resolve.data.length <= 0) { this.setState({ posts: [] }) }
				else {
					this.setState({ //store the resolved posts in posts state, then sort for date, then pinned status
						posts: resolve.data
						//posts: this.state.posts.concat(resolve.data) | note to self: push bad, concat good
					})
				}
				this.setState({
					posts: sortedPosts(this.state.posts)
				})
			})
			.catch((err) => { console.log(err); this.props.connError(); })
	}

	round(x) { return Math.abs(x) > 999 ? Math.sign(x) * ((Math.abs(x) / 1000).toFixed(1)) + 'k' : Math.sign(x) * Math.abs(x) } //round value to nearest thousand, add k suffix
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


	/* mapping the data with a key of {index}, display data.content */
	render() {
		return (
			<main>
				<div className='no_post no_select'>{this.state.posts.length <= 0 ? <div>No posts yet today! Be the first to share something!</div> : false}</div>

				<div className='message-container' aria-live='polite'> {this.state.posts.map((data, index) => (
					<div className={this.state.settings.compact ? 'message compact' : 'message'} key={index} value={data.postID}>
						<div className='content'>
							{data.pinned ? <i title="This post has been pinned to the top. It's probably important." className='pinned fa fa-thumb-tack' /> : false}
							{data.content}

							<div className='sub-content'>
								<div className='date no_select' title={new Date(data.date).toUTCString()}>{new Date(data.date).toLocaleTimeString()}</div>
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
		this.canvasRef = React.createRef();
		this.var = {
			maxLength: 128,
		}
		this.state = {
			content: '',
			disclaimer: true,
			progress: 0,
		}
	}

	componentDidMount() { this.draw(); }

	draw() {
		const canvas = this.canvasRef.current;
		const ctx = canvas.getContext('2d');
		const width = canvas.width;
		const height = canvas.height;

		//Define Styles
		ctx.strokeStyle = '#5ebcff'; ctx.lineWidth = 4;

		ctx.beginPath();
		ctx.clearRect(0, 0, width, height);
		//x, y, radius, sAngle, eAngle, counterClockwise
		ctx.arc(width / 2, height / 2, width / 2.5, (this.state.progress) * Math.PI, 2 * Math.PI);
		ctx.stroke();
	}

	async handleSend() {
		const content = this.state.content;

		//check if total length excluding whitespace is more than 2 char
		if (content.trim().length >= 2) {
			await sendData(content)
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
		this.draw();
	}

	onEnterPress = (e) => { if (e.keyCode === 13 && e.shiftKey === false) { e.preventDefault(); this.handleSend(); } }

	render() { //might restructure to be a form for accessibility
		return (
			<div className="chat_stuffs" >
				{this.state.disclaimer ?
					<footer className='disclaimer'>
						<span>{`Disclaimer: All posts you make are anonymous, as well as the posts you've interacted with.\nWe remove all posts at midnight (GMT).`}</span>
						<button aria-label='Close Disclaimer' className='btn'
							onClick={() => {
								this.setState({ disclaimer: false })
							}}
						>Start Chatting!</button></footer> : false}

				<div className='userArea'>
					<textarea className="userInput no_select" placeholder="Share something!"
						maxLength={this.var.maxLength} value={this.state.content}
						aria-label='Message textbox. Press enter to send a message.'
						onChange={(event) => {
							this.setState({ content: event.target.value, progress: (this.state.content.length / this.var.maxLength) * 2 });
							this.draw();
						}}

						onKeyDown={this.onEnterPress} />

					<button aria-label='Send Message' className='send-message btn send'
						disabled={this.state.content.trim().length >= 2 ? false : true}
						style={this.state.content.trim().length >= 2 ? { backgroundColor: '#5ebcff' } : { backgroundColor: '#d3d3d3' }}
						onClick={this.handleSend}><i className="fa fa-send" /></button>

					<span className='limit'>
						<canvas ref={this.canvasRef} className='no_select' width={20} height={20}></canvas>
						<span>{this.var.maxLength - this.state.content.length}</span>
					</span>

				</div>
			</div>
		)
	}
}

export default App;