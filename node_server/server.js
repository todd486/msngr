const http = require('http');
const querystring = require('querystring');
const stream = require('stream')

const credit = (`Isabelle ${new Date(Date.now()).getFullYear()}`);

//values related to where and how server is hosted
const hostname = 'localhost';
const port = '8080';

//const httpAgent = new http.Agent({ keepAlive : true });

//GLOBAL FUNCTIONS
function printTime() { return (`<${new Date(Date.now()).toLocaleTimeString()}>`) }
function token(length) { //generates a token of random characters of a specific length
    const validChar = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
    let output = '';
    for (let i = 0; i < length; i++) { output += validChar.charAt(Math.floor(Math.random() * validChar.length)) }
    return output;
}

//VARIABLES
var activePosts = [
    {postID: token(8), content: 'abow', votes: Math.floor(Math.random() * 10), date: Date.now()}, 
    {postID: token(8), content: 'asdasda', votes: Math.floor(Math.random() * 10), date: Date.now()},
    {postID: token(8), content: 'aboasdasasdw', votes: Math.floor(Math.random() * 10), date: Date.now()},
    {postID: token(8), content: 'abow', votes: Math.floor(Math.random() * 10), date: Date.now()},
    {postID: token(8), content: 'aboasdasdasdw', votes: Math.floor(Math.random() * 10), date: Date.now()},
    {postID: token(8), content: 'abow', votes: Math.floor(Math.random() * 10), date: Date.now()},
    {postID: token(8), content: 'absadasdow', votes: Math.floor(Math.random() * 10), date: Date.now()},
    {postID: token(8), content: 'abadsasdow', votes: Math.floor(Math.random() * 10), date: Date.now()},
];
var newPost = false;

//TODO: session checking, ssl?
const server = http.createServer(async(request, response) => {
    function refresh() {
        //activePosts.push({postID: token(8), content: 'abow', votes: Math.floor(Math.random() * 10), date: Date.now()})
        //console.log(activePosts)
    }

    //CONFIG
    response.writeHead(200, { //write header with status 200, allow CORS and set encoding type
        'Access-Control-Allow-Origin' : '*',
        'Content-Type': 'application/json',
    }); 
    request.setEncoding('utf8');
    server.setTimeout(1000); //Set to timeout after 1 sec 
    this.timer = setInterval(() => refresh(), 5000 )

    //GET
    if (request.method === 'GET') { 
        console.log(`[INFO]${printTime()} Received GET query: ${JSON.stringify(querystring.decode(request.url, '?'))} from ${request.socket.localAddress}`);

        switch (querystring.decode(request.url, '?').q) { //using switch statement for future functionality
            case 'getposts' : { 
                response.write(JSON.stringify(activePosts)); break;
            }
            case 'check' : {
                if (newPost === true) { response.write('true'); } 
                else { response.write('false'); }
                break;
            }
            // case 'getvotes' : {
            //     if (activePosts.find(x => x.postID === querystring.decode(request.url, '?').postID)) {

            //     } else { response.statusCode = 404; }
            //     break;
            // }
            default : { response.statusCode = 404; } //Not found
        }
    } 

    //TODO: Implement spam protections and more bad actor protections
    //POST
    if (request.method === 'POST') { 
        console.log(`[INFO]${printTime()} Received POST query: ${JSON.stringify(querystring.decode(request.url, '?'))} from ${request.socket.localAddress}`);

        switch (querystring.decode(request.url, '?').q) {
            case 'post' : {
                let body = ''; //create temporary value to store body
                request.on('data', (chunk) => {
                    if (chunk.length > 1e6) { //kill the connection if chunk larger than 1e6 bytes (1000000 bytes ~~~ 1MB)
                        console.log(`[WARN]${printTime()} User sent too large chunk, destroying connection.`)
                        request.statusCode = 413; //Request too large
                        request.connection.destroy();
                    } else { body += chunk; } //else add the chunk to body

                    try { request.statusCode = 201; //Accepted
                        let parsedBody = JSON.parse(body); //parse the transfer stringified json
                        if (parsedBody.length < 2) { response.statusCode = 401; response.end(); }

                        let formattedPost = {
                            postID: token(8), 
                            content: parsedBody.data,
                            votes: 1,
                            date: Date.now(),
                        } //Generate the additional data relevant to post

                        //console.log(`[INFO]${printTime()} Formatted post: ${JSON.stringify(formattedPost)}`) //echo the formatted post (DEBUG)
                        //cycle the least upvoted post out
                        activePosts.push(formattedPost);

                    } catch (err) { request.statusCode = 500; //Internal server error
                        console.log(`[ERROR]${printTime()} Uncaught exception in POST data handling: ${err}`)
                    }
                });
                
                break;
            }
            case 'vote' : {
                //check which post the user wishes to vote on
                //check if post exists, and if user has voted on it already
                //TODO: make sure user can undo votes

                if (activePosts.find(x => x.postID === querystring.decode(request.url, '?').postID)) {
                    switch(querystring.decode(request.url, '?').v) {
                        case 'upvote' : {
                            try { request.statusCode = 201;

                            } catch (err) { request.statusCode = 500;

                            }
                            
                            break;
                        }
                        case 'downvote' : {
                            try { request.statusCode = 201;

                            } catch (err) { request.statusCode = 500;

                            }

                            break;
                        }
                        default : {
                            request.statusCode = 403; console.log(`[WARN]${printTime()} User requested invalid operation on post.`);
                        }
                    }
                } else { request.statusCode = 403; console.log(`[WARN]${printTime()} User requested to vote on non-existant post.`); }

                break;
            }
            default : {
                request.statusCode = 403; console.log(`[WARN]${printTime()} User requested invalid query. (If this request wasn't made through the client, ignore this.)`);
            }
        }
    } 
    response.end(); //once all possible actions could have been taken, end communication
})

server.listen(port, hostname, () => {
    console.log(`[INFO]${printTime()} Server running at http://${hostname}:${port}/, ${credit}`); 
})
