import now from '@now/node'

function token(length) { //generates a token of random characters of a specific length
    const validChar = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
    let output = ''; for (let i = 0; i < length; i++) { output += validChar.charAt(Math.floor(Math.random() * validChar.length)) }
    return output;
};

var actP = [];
var actS = [];

export default (req: now.NowRequest, res: now.NowResponse) => {
    res.writeHead(200, { //write header with status 200, allow CORS and set encoding type
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Connection': 'Keep-Alive',
        'Keep-Alive': 'Timeout=5, max=1000' //Keepalive connection for 5 seconds with a max of 1000 requests per connection
    });
    req.setEncoding('utf8');

    function refresh() { //define what should occur during each refresh
        actS.forEach((item, index, object) => {
            if (Math.abs(item.lastAct - Date.now()) > 1e6) /* each token expires after 1e6 milliseconds ~~~ 16,7 minutes */ {
                console.log(`[INFO] Session token expired: ${JSON.stringify(object)}`);
                object.splice(index, 1); //splice out the session token
            };
        });
        //check if a post is below vote threshold (-10 votes)
        actP.forEach(x => {
            if (x.votes.total <= -10) {
                console.log(`[INFO] Removed post below threshold. ${x.id}, ${x.votes.total}, ${new Date(x.date).toLocaleTimeString()}`)
                actP.splice(x, 1)
            }
        })
    };

    function sessionCheck() {
        let success = false;
        function timeCheck(query) {
            switch (query) {
                case 'init': {
                    console.log(`[INFO] New user found! Initialized user with IP adress: ${req.socket.localAddress}`);
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
                    console.log(`[WARN] Default in timeCheck().`)
                }
            }
        };
        try { //check if last action was less than 500 ms ago
            if (actS.find(x => x.ip === req.socket.localAddress) === undefined) { timeCheck('init'); } //check if the user exists
            if (Math.abs(actS[actS.findIndex(x => x.ip === req.socket.localAddress)].lastAct - Date.now()) < 500) {
                res.statusCode = 403; //Forbidden
                res.end();
                throw new Error(`User requested to quickly!`);
            } else { success = true; }
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
                            default: { console.log(`[WARN] Defaulted in vote total calc, invalid post data?`) }
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

    const { q = undefined, v = undefined, id = undefined } = req.query; //queries from user

    if (sessionCheck()) {
        switch (req.method) {
            case 'GET': {
                switch (q) { //using switch statement for further expandablity
                    case 'posts': { res.write(JSON.stringify(actP)); res.end(); }
                    default: { res.statusCode = 404; res.end(); } /* Not Found */
                }
            }
            case 'POST': {
                function handleData() {
                    return new Promise((resolve, reject) => {
                        let body = ''; //create temporary value to store body
                        req.on('data', (chunk) => {
                            if (chunk.length > 1e6) { //kill the connection if chunk larger than 1e6 bytes (1000000 bytes ~~~ 1MB)
                                console.log(`[WARN] User sent chunk larger than 1MB, destroying connection!`)
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
                switch (q) {
                    case 'post': {
                        handleData()
                            .then(resolve => {
                                let formattedPost = { //Generate the additional data relevant to post
                                    id: token(8),
                                    content: resolve,
                                    votes: { total: 0, voters: [] },
                                    date: Date.now(),
                                    pinned: false,
                                };
                                actP.push(formattedPost);
                            })
                            .catch((reject) => {
                                req.statusCode = 500;
                                console.log(`[WARN] Exception in post data handling: ${reject}`)
                            }) //Internal server error
                            res.end();
                        break;
                    }
                    case 'vote': {
                        if (actP.find(x => x.id === id)) {
                            vote(v, id)
                                .then(() => { res.end(); })
                                .catch((reject) => { res.end();
                                    console.log(`[WARN] Rejected vote query. ${reject}`)
                                })

                        } else { req.statusCode = 400; //Bad Request
                            console.log(`[WARN]$ User requested to vote on non-existant post.`);
                        }
                        break;
                    }
                    case 'report': {
                        if (actP.find(x => x.id === id)) {
                            handleData()
                                .then((resolve) => {
                                    console.log(`[REPORT] ${JSON.stringify(actP[actP.findIndex(x => x.id === id)].id)} Reason: "${resolve}" `)
                                })
                                .catch((reject) => {
                                    req.statusCode = 500; //Internal server error
                                    console.log(`[WARN] Exception in report data handling: ${reject}`)
                                })
                        } else {
                            req.statusCode = 400; //Bad Request
                            console.log(`[WARN] User requested to report non-existant post.`);
                        }
                        break;
                    }
                    default: {

                    }
                }
            }
            default: { res.statusCode = 405; res.end(); } //Method Not Supported
        }
    } else { res.statusCode = 401; res.end(); } //Forbidden

    res.end();
}