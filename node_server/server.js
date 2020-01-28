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
var activePosts = [];
//{id: token(8), ip: 127.0.0.1, lastAct: Date.now()}
var activeSessions = [];

//TODO: session checking, ssl?
const server = http.createServer(async(req, res) => {
    this.timer = setInterval(() => refresh(), 10000 )
    function refresh() {
        activeSessions.forEach((item, index, object) => {
            if (Math.abs(item.lastAct - Date.now()) > 1e6) /* each token expires after 1e6 milliseconds ~~~ 16,7 minutes */ {
                console.log()
                object.splice(index, 1);
            };
        });
    }

    //CONFIG
    res.writeHead(200, { //write header with status 200, allow CORS and set encoding type
        'Access-Control-Allow-Origin' : '*',
        'Content-Type': 'application/json',
        'Connection': 'Keep-Alive',
        'Keep-Alive': 'Timeout=5, max=1000' //Keepalive connection for 5 seconds with a max of 1000 requests per connection
    }); 
    res.shouldKeepAlive = true;
    req.setEncoding('utf8');
    //server.setTimeout(1000); //Set to timeout after 1 sec 

    //check if user exists

    //GET
    if (req.method === 'GET') { 
        console.log(`[INFO]${printTime()} Received GET query: ${JSON.stringify(querystring.decode(req.url, '?'))} from ${req.socket.localAddress}`);

        switch (querystring.decode(req.url, '?').q) { //using switch statement for future functionality
            case 'getposts' : { 
                res.write(JSON.stringify(activePosts)); res.end()
            }
            case 'stream' : {
                
            }
            default : { res.statusCode = 404; } //Not found
        }
    } 

    //TODO: Implement spam protections and more bad actor protections
    //POST
    if (req.method === 'POST') { 
        console.log(`[INFO]${printTime()} Received POST query: ${JSON.stringify(querystring.decode(req.url, '?'))} from ${req.socket.localAddress}`);

        switch (querystring.decode(req.url, '?').q) {
            case 'post' : {
                let body = ''; //create temporary value to store body
                req.on('data', (chunk) => {
                    if (chunk.length > 1e6) { //kill the connection if chunk larger than 1e6 bytes (1000000 bytes ~~~ 1MB)
                        console.log(`[WARN]${printTime()} User sent too large chunk, destroying connection.`)
                        req.statusCode = 413; //Request too large
                        req.connection.destroy();
                    } else { body += chunk; } //else add the chunk to body

                    try { req.statusCode = 201; //Accepted
                        let parsedBody = JSON.parse(body); //parse the transfer stringified json

                        if (parsedBody <= 1) { res.statusCode = 401; res.end(); } //check if message length would be less than one char
                        else { let formattedPost = { //Generate the additional data relevant to post
                                postID: token(8), 
                                content: parsedBody.data,
                                votes: 1,
                                date: Date.now(),
                            };
                            activePosts.push(formattedPost);
                            console.log(activePosts)
                            res.end();
                        }
                    } catch (err) { req.statusCode = 500; //Internal server error
                        console.log(`[ERROR]${printTime()} Uncaught exception in POST data handling: ${err}`)
                    }
                });
                
                break;
            }
            case 'vote' : {
                //check which post the user wishes to vote on
                //check if post exists, and if user has voted on it already
                //TODO: make sure user can undo votes

                if (activePosts.find(x => x.postID === querystring.decode(req.url, '?').postID)) {
                    switch(querystring.decode(req.url, '?').v) {
                        case 'upvote' : {
                            try { req.statusCode = 201;

                            } catch (err) { req.statusCode = 500;

                            }
                            
                            break;
                        }
                        case 'downvote' : {
                            try { req.statusCode = 201;

                            } catch (err) { req.statusCode = 500;

                            }

                            break;
                        }
                        default : {
                            req.statusCode = 403; console.log(`[WARN]${printTime()} User requested invalid operation on post.`);
                        }
                    }
                } else { req.statusCode = 403; console.log(`[WARN]${printTime()} User requested to vote on non-existant post.`); }

                break;
            }
            default : {
                req.statusCode = 403; console.log(`[WARN]${printTime()} User requested invalid query. (If this request wasn't made through the client, ignore this.)`);
            }
        }
    } 
    req.once('end', () => {
        req.connection.destroy(); //destroy connection if user requests it
    })
    //req.end(); //once all possible actions could have been taken, end communication
})

server.listen(port, hostname, () => {
    console.log(`[INFO]${printTime()} Server running at http://${hostname}:${port}/, ${credit}`); 
})
