const http = require('http');
const qs = require('querystring');

const credit = (`Isabelle ${new Date(Date.now()).getFullYear()}`);

//values related to where and how server is hosted
const hostname = 'localhost';
const port = '8080';

//GLOBAL FUNCTIONS
function printTime() { return (`<${new Date(Date.now()).toLocaleTimeString()}>`) };
function token(length) { //generates a token of random characters of a specific length
    const validChar = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
    let output = ''; for (let i = 0; i < length; i++) { output += validChar.charAt(Math.floor(Math.random() * validChar.length)) }
    return output;
};

//VARIABLES
var stdin = process.openStdin(); //opens the console
var actP = []; //{ id: token(8), content: 'Sample Text', votes: { total: 12300, voters: [] }, date: Date.now(), pinned: true, }
var actS = [];
var verbose = process.argv.includes('-v') ? true : false; //if includes returns true then true is assigned to verbose, and vise versa.

//TODO: implement optional chaining: object?.type?.subtype; if any of the types cannot be found the app won't crash and can simply continue without the strict type
//BIG TODO: rework into HTTP/2; use server push
const server = http.createServer((req, res) => {
    this.timer = setInterval(() => refresh(), 5000); //set an interval to call refresh every 5 seconds

    //SERVERSIDE FUNCTIONS
    function refresh() { //define what should occur during each refresh
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
        }));
    };

    function sessionCheck() {
        let success = false;
        function timeCheck(query) {
            switch (query) {
                case 'init': {
                    console.log(`[INFO]${printTime()} New user found! Initialized user with IP adress: ${req.socket.localAddress}`);
                    actS.push({ //push a new session into memory
                        id: token(8),
                        ip: req.socket.localAddress,
                        lastAct: new Date(Date.now()),
                    });
                    break;
                }
                case 'update': {
                    actS[actS.findIndex(x => x.ip === req.socket.localAddress)].lastAct = Date.now();
                    break;
                }
                default: {
                    console.log(`[WARN]${printTime()} Default in timeCheck().`)
                }
            }
        };
        try { //check if last action was less than 500 ms ago
            if (actS.find(x => x.ip === req.socket.localAddress) === undefined) {
                timeCheck('init');
            }
            if (Math.abs(actS[actS.findIndex(x => x.ip === req.socket.localAddress)].lastAct, Date.now()) < 500) {
                res.statusCode = 403; //Forbidden
                res.end();
                throw new Error(`User requested to quickly!`);
            } else {
                success = true;
            }
        } catch (err) {
            console.log(`[WARN] Exception caught in sessionCheck(). ${err}`)
        } finally { //if exception is caught, timeCheck() should run and should cause the try statement to succeed
            timeCheck('update');
            return success;
        }
    };

    function vote(query, id) {
        function apply() {
            return new Promise((resolve, reject) => {
                try { //if user hasn't taken an action, apply one accordingly
                    if (!actP[actP.findIndex(x => x.id === id)].votes.voters.some(
                        x => x.id === actS[actS.findIndex(x => x.ip === req.socket.localAddress)].id
                    )) { //push the user into the list of users who have voted
                        actP[actP.findIndex(x => x.id === id)].votes.voters.push({
                            id: actS[actS.findIndex(x => x.ip === req.socket.localAddress)].id,
                            action: query
                        })
                    } else { //else remove that action. find index of voters, where the index is equal to the userID
                        actP[actP.findIndex(x => x.id === id)].votes.voters.splice(
                            actP[actP.findIndex(x => x.id === id)].votes.voters.findIndex(
                                x => x.id === actS[actS.findIndex(x => x.ip === req.socket.localAddress)].id), 1)
                        //then splice it out
                    }
                    resolve();
                } catch (err) {
                    reject(`${err}`);
                }
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
    };

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

    //MAIN
    if (sessionCheck()) {
        switch (req.method) {
            case 'GET': {
                // verbose && console.log(`[INFO]${printTime()} Received GET query: ${JSON.stringify(qs.decode(req.url, '?'))} from ${req.socket.localAddress}`);
                switch (qs.decode(req.url, '?').q) { //using switch statement for future functionality
                    case 'posts': {
                        res.write(JSON.stringify(actP));
                        //TODO: filter out the user id's of those who have voted so it doesn't get sent out to the client, does it matter though?
                    }
                    default: {
                        res.statusCode = 404; //Not found
                        res.end();
                    }
                }
                break;
            };
            case 'POST': {
                function handleData() {
                    return new Promise((resolve, reject) => {
                        let body = ''; //create temporary value to store body
                        req.on('data', (chunk) => {
                            if (chunk.length > 1e6) { //kill the connection if chunk larger than 1e6 bytes (1000000 bytes ~~~ 1MB)
                                console.log(`[WARN]${printTime()} User sent chunk larger than 1MB, destroying connection!`)
                                req.statusCode = 413; //Request too large
                                req.connection.destroy();
                                reject();
                            } else { //else add the chunk to body
                                body += chunk;
                            }
                            req.statusCode = 201; //Accepted
                            let parsedBody = JSON.parse(body); //parse the transfer stringified json
                            resolve(parsedBody.data);
                        });
                    })
                }

                // verbose && console.log(`[INFO]${printTime()} Received POST query: ${JSON.stringify(qs.decode(req.url, '?'))} from ${req.socket.localAddress}`);
                switch (qs.decode(req.url, '?').q) {
                    case 'post': {
                        handleData()
                            .then((resolve) => {
                                let formattedPost = { //Generate the additional data relevant to post
                                    id: token(8),
                                    content: resolve,
                                    votes: { total: 0, voters: [] },
                                    date: Date.now(),
                                    pinned: false,
                                };
                                verbose && console.log(formattedPost);
                                actP.push(formattedPost);
                            })
                            .catch((reject) => {
                                req.statusCode = 500; //Internal server error
                                console.log(`[WARN]${printTime()} Exception in post data handling: ${reject}`)
                            })

                        break;
                    }
                    case 'vote': {
                        //TODO: make sure user can undo votes and that votes cant be cast more than once

                        if (actP.find(x => x.id === qs.decode(req.url, '?').id)) {
                            vote(qs.decode(req.url, '?').v, qs.decode(req.url, '?').id)
                                .then(() => {
                                    res.end();
                                })
                                .catch((reject) => {
                                    console.log(`[WARN]${printTime()} Rejected vote query. ${reject}`)
                                    res.end();
                                })

                        } else {
                            req.statusCode = 400; //Bad Request
                            console.log(`[WARN]${printTime()} User requested to vote on non-existant post.`);
                        }
                        break;
                    }
                    case 'report': {
                        if (actP.find(x => x.id === qs.decode(req.url, '?').id)) {
                            handleData()
                                .then((resolve) => {
                                    console.log(`[REPORT]${printTime()} ${JSON.stringify(actP[actP.findIndex(x => x.id === qs.decode(req.url, '?').id)].id)} Reason: "${resolve}" `)
                                })
                                .catch((reject) => {
                                    req.statusCode = 500; //Internal server error
                                    console.log(`[WARN]${printTime()} Exception in report data handling: ${reject}`)
                                })
                        } else {
                            req.statusCode = 400; //Bad Request
                            console.log(`[WARN]${printTime()} User requested to report non-existant post.`);
                        }
                        break;
                    }
                    default: {
                        req.statusCode = 400; //Bad Request
                        console.log(`[WARN]${printTime()} User requested invalid query. (If this request wasn't made through the client, ignore this.)`);
                    }
                }
                break;
            };
            default: {
                res.statusCode = 405; //Method Not Supported
                res.end();
            };
        }
    } else {
        res.statusCode = 401; //Forbidden
        res.end()
    };
    res.end()
    // req.once('end', () => {
    //     req.connection.destroy(); //destroy connection if user requests it
    // })
    //req.end(); //once all possible actions could have been taken, end communication
})

server.listen(port, hostname, () => {
    verbose && console.log(`[INFO]${printTime()} Verbose logging enabled!`)
    console.log(`[INFO]${printTime()} Server running at http://${hostname}:${port}/, ${credit}`);

    //COMMAND INTERPRETER
    stdin.addListener('data', (command) => { //command is a buffer of raw bytes
        let buffer = command.toString().replace(/\r?\n|\r/, '').split(' ') //split them into individual strings as an array

        function exists(id) {
            return new Promise((resolve, reject) => {
                try {
                    let foundIndex = actP.findIndex(x => x.id === id)
                    resolve(foundIndex);
                } catch (err) { reject('Failed to find post.') };
            })
        }

        switch (buffer[0]) { //BUG: removes pinned posts instead of chosen post
            case 'rmp': { //remove post
                exists(buffer[1])
                    .then((resolve) => { 
                        console.log(`Removed post: ${JSON.stringify(actP[resolve].id)}`); 
                        actP.splice(actP[resolve], 1) 
                    })
                    .catch(err => { console.log(err) })
                break;
            }
            case 'pin': { //pin post
                exists(buffer[1])
                    .then(index => { 
                        console.log(`Pinned post: ${JSON.stringify(actP[index].id)}`);
                        actP[index].pinned = true 
                    })
                    .catch(err => { console.log(err) })
                break;
            }
            default: {
                console.log('Invalid Command')
            }
        }
    })
})
