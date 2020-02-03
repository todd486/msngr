const http = require('http');
const querystring = require('querystring');
// const Agent = require('agentkeepalive');
const stream = require('stream');

const credit = (`Isabelle ${new Date(Date.now()).getFullYear()}`);

//values related to where and how server is hosted
const hostname = 'localhost';
const port = '8080';

//https://www.npmjs.com/package/agentkeepalive
// const keepaliveAgent = new Agent({

// })

//GLOBAL FUNCTIONS
function printTime() { return (`<${new Date(Date.now()).toLocaleTimeString()}>`) }
function token(length) { //generates a token of random characters of a specific length
    const validChar = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
    let output = ''; for (let i = 0; i < length; i++) { output += validChar.charAt(Math.floor(Math.random() * validChar.length)) }
    return output;
}

//VARIABLES
var actP = [];
var actS = [];

//TODO: session checking, ssl?
const server = http.createServer((req, res) => {
    this.timer = setInterval(() => refresh(), 5000); //set an interval to call refresh every 5 seconds
    function refresh() {
        actS.forEach((item, index, object) => {
            if (Math.abs(item.lastAct - Date.now()) > 1e6) /* each token expires after 1e6 milliseconds ~~~ 16,7 minutes */ {
                console.log(`[INFO]${printTime()} Session token expired: ${JSON.stringify(object)}`);
                object.splice(index, 1); //splice out the session token
            };
        });
        //check if a post is below vote threshold (-10 votes)
        if (actP.forEach(x => {
            if (x.votes.total <= -10) {
                console.log(`[INFO]${printTime()} Removed post below threshold. ${x.id}, ${x.votes.total}, ${new Date(x.date).toLocaleTimeString()}`)
                actP.splice(x, 1)
            }
        })) {

        }
    }
    function sessionCheck() { //BUGGED: doesn't really work with checking since last activity was
        let success = false;
        function timeCheck() {
            //check if an active session from user already exists
            if (actS.find(x => x.ip === req.socket.localAddress) === undefined) {
                console.log(`[INFO]${printTime()} New user found! Initialized user with IP adress: ${req.socket.localAddress}`);
                actS.push({
                    id: token(8),
                    ip: req.socket.localAddress,
                    lastAct: new Date(Date.now()),
                }); //push a new session into memory
            } else { actS[actS.findIndex(x => x.ip === req.socket.localAddress)].lastAct = Date.now(); };
            //else: update the user's current last action to be now
        }
        //check if last action was less than 2000 ms ago
        if (actS[actS.findIndex(x => x.lastAct)] === undefined) { timeCheck(); }
        else {
            //console.log(Math.abs(actS[actS.findIndex(x => x.ip === req.socket.localAddress)].lastAct, Date.now()) < 1000)
            if (Math.abs(actS[actS.findIndex(x => x.ip === req.socket.localAddress)].lastAct, Date.now()) < 1000) {
                console.log(`[WARN]${printTime()} User requested to quickly!`);
                res.statusCode = 403; //Forbidden
                res.end()
            } else { success = true; }
        }
        timeCheck();
        return success;
    }
    function vote(query, id) {
        function apply() {
            return new Promise((resolve, reject) => {
                //if user hasn't taken an action, apply one accordingly
                if (!actP[actP.findIndex(x => x.id === id)].votes.voters.some(
                    x => x.id === actS[actS.findIndex(x => x.ip === req.socket.localAddress)].id
                )) {
                    //push the user into the list of users who have voted
                    actP[actP.findIndex(x => x.id === id)].votes.voters.push({
                        id: actS[actS.findIndex(x => x.ip === req.socket.localAddress)].id,
                        action: query
                    })
                } else {
                    //else remove that action. find index of voters, where the index is equal to the userID
                    actP[actP.findIndex(x => x.id === id)].votes.voters.splice(
                        actP[actP.findIndex(x => x.id === id)].votes.voters.findIndex(
                            x => x.id === actS[actS.findIndex(x => x.ip === req.socket.localAddress)].id), 1)
                    //then splice it out
                }
                resolve();
            })
        }
        return new Promise((resolve, reject) => {
            apply()
                .then(() => {
                    //console.log(actP[actP.findIndex(x => x.id === id)].votes.voters)
                    //update value
                    let tempTotal = 0;
                    actP[actP.findIndex(x => x.id === id)].votes.voters.forEach(x => {
                        switch (x.action) {
                            case 'upvote': { tempTotal++; break; }
                            case 'downvote': { tempTotal--; break; }
                            default: { console.log(`[WARN]${printTime()} Defaulted in vote total calc, invalid post data?`) }
                        }
                    });
                    actP[actP.findIndex(x => x.id === id)].votes.total = tempTotal;
                    resolve();
                })
                .catch((err) => {
                    reject(`Exception caught in apply(): ${err}`)
                })
        })
    }

    //CONFIG
    res.writeHead(200, { //write header with status 200, allow CORS and set encoding type
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Connection': 'Keep-Alive',
        'Keep-Alive': 'Timeout=5, max=1000' //Keepalive connection for 5 seconds with a max of 1000 requests per connection
    });
    res.shouldKeepAlive = true;
    req.setEncoding('utf8');
    server.setTimeout(1000); //Set to timeout after 1 sec 

    if (sessionCheck()) {
        //GET
        if (req.method === 'GET') {
            //console.log(`[INFO]${printTime()} Received GET query: ${JSON.stringify(querystring.decode(req.url, '?'))} from ${req.socket.localAddress}`);

            switch (querystring.decode(req.url, '?').q) { //using switch statement for future functionality
                case 'posts': {
                    res.write(JSON.stringify(actP));
                }
                default: { res.statusCode = 404; res.end(); } //Not found
            }
        };

        //POST
        if (req.method === 'POST') {
            console.log(`[INFO]${printTime()} Received POST query: ${JSON.stringify(querystring.decode(req.url, '?'))} from ${req.socket.localAddress}`);

            switch (querystring.decode(req.url, '?').q) {
                case 'post': {
                    let body = ''; //create temporary value to store body
                    req.on('data', (chunk) => {
                        if (chunk.length > 1e6) { //kill the connection if chunk larger than 1e6 bytes (1000000 bytes ~~~ 1MB)
                            console.log(`[WARN]${printTime()} User sent chunk larger than 1MB, destroying connection!`)
                            req.statusCode = 413; //Request too large
                            req.connection.destroy();
                        } else { body += chunk; } //else add the chunk to body

                        try {
                            req.statusCode = 201; //Accepted
                            let parsedBody = JSON.parse(body); //parse the transfer stringified json

                            if (parsedBody.toString() <= 1) { res.statusCode = 401; res.end(); } //check if message length would be less than one char
                            else {
                                let formattedPost = { //Generate the additional data relevant to post
                                    id: token(8),
                                    content: parsedBody.data,
                                    votes: { total: 0, voters: [] },
                                    date: Date.now(),
                                };
                                actP.push(formattedPost);
                                res.end();
                            }
                        } catch (err) {
                            req.statusCode = 500; //Internal server error
                            console.log(`[ERROR]${printTime()} Uncaught exception in POST data handling: ${err}`)
                        }
                    });

                    break;
                }
                case 'vote': {
                    //TODO: make sure user can undo votes and that votes cant be cast more than once

                    if (actP.find(x => x.id === querystring.decode(req.url, '?').id)) {
                        vote(querystring.decode(req.url, '?').v, querystring.decode(req.url, '?').id)
                            .then(() => {
                                res.end();
                            })
                            .catch((reject) => {
                                console.log(`[WARN]${printTime()} Rejected vote query. ${reject}`)
                                res.end();
                            })

                    } else { req.statusCode = 403; console.log(`[WARN]${printTime()} User requested to vote on non-existant post.`); }
                    break;
                }
                default: { req.statusCode = 403; console.log(`[WARN]${printTime()} User requested invalid query. (If this request wasn't made through the client, ignore this.)`); }
            }
        };
    } else { res.statusCode = 400; res.end(); }

    // req.once('end', () => {
    //     req.connection.destroy(); //destroy connection if user requests it
    // })
    //req.end(); //once all possible actions could have been taken, end communication
})

server.listen(port, hostname, () => {
    console.log(`[INFO]${printTime()} Server running at http://${hostname}:${port}/, ${credit}`);
})
