const http = require('http');
const querystring = require('querystring');
//const fs = require('fs');
// const assert = require('assert');
// const mongoclient = require('mongodb').MongoClient;

//to be removed
const posts = require('./posts.json')

//values related to where and how server is hosted
const hostname = 'localhost';
const port = '8080';
// const databaseurl = `mongodb://${hostname}:27017/`;

//database related
// const databasename = 'posts'
// const client = new mongoclient(databaseurl)

function printDate() { return ("[" + new Date(Date.now()).toUTCString() + "] ")}

const server = http.createServer((request, response) => {

    // client.connect((databaseurl) => {
    //     assert.equal(null, err);
    //     console.log('[INFO] Successfully connected to database')
    //     const database = client.db(databasename);
    //     client.close()
    // })

    //store the users who are currently connected in an array
    let connectedUsers = []

    //server functions
    function init() {
        //write a header for OK status
        response.writeHead(200, {
            'Content-Type': 'application/json',
        });
    
        //TODO: make tokens expire after a while
        let requesteeAdress = request.connection.remoteAddress;
    
        //check if same ip adress is found to be still connected
        if (connectedUsers.find(x => x.userAdress === requesteeAdress) === undefined ) {
            //if one cant be found, give the new ip adress a token, and reply with it
            connectedUsers.push({ userID: token(8), userAdress: requesteeAdress })

            //log who just connected
            console.log('[INFO]' + printDate() + JSON.stringify(connectedUsers.find(x => x.userAdress === requesteeAdress)))

            //write to response and end comm
            response.write(JSON.stringify(connectedUsers[connectedUsers.findIndex(x => x.userAdress === requesteeAdress)]))
        } else {
            //else reply with the token they we're already given.
            console.log('[WARN]' + printDate() + 'User with same ip adress found; assumed same user, gave same token.')
            response.write(JSON.stringify(connectedUsers.find(x => x.userAdress === requesteeAdress)))
        }
    }
    //generates a token of random characters of a specific length
    function token(length) {
        const validChar = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
        let output = '';
        for (let i = 0; i < length; i++) { output += validChar.charAt(Math.floor(Math.random() * validChar.length)) }
        return output;
    }
    
    //allow CORS
    //response.writeHead("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept", "Access-Control-Allow-Origin", "*")
    response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    response.setHeader("Access-Control-Allow-Origin", "*");

    //GET requests
    if (request.method === 'GET') {
        console.log('[INFO]' + printDate() + 'Received GET query:' + JSON.stringify(querystring.decode(request.url, '?')) )
        switch(querystring.decode(request.url, '?').q) {
            case 'init' : { init(); break; } //initialize user 
            case 'gettop' : {
                //get most popular 128 posts for the day
                response.writeHead(200, {
                    'Content-Type': 'application/json',
                });

                response.write(JSON.stringify(posts))
                break;
            }   
            case 'getnew' : {
                //TODO: stream in new posts as they come in
                response.writeHead(200, {
                    'Content-Type': 'application/json',
                });

                response.write('get new')
                break;
            }
            default : {
                //default to 404
                response.statusCode = 404;
            }
        }
    } 

    //handle POST requests; example http://localhost:8080/?q=vote&?postID=XXXXXXXX&?v=upvote
    //TODO: handle spam requests
    if (request.method === 'POST') {
        if (connectedUsers.find(x => x.userAdress === request.connection.remoteAddress) === undefined ) { 
            console.log('[WARN]' + printDate() + 'Uninitialized user detected. Reinitializing.'); init(); }

        //print what any user has requested.
        console.log('[INFO]' + printDate() + 'Received POST query:' + JSON.stringify(querystring.decode(request.url, '?')) )

        switch(querystring.decode(request.url, '?').q) {
            case 'post' : {
                //create temporary value to store data
                let recievedData = '';
                request.on('data', (data) => {
                    recievedData += data
                    //kill the connection if user tries to send a message longer than 1e6 bytes (1000000 bytes ~~~ 1MB)
                    if (data.length > 1e6) {
                        console.log('[WARN]' + printDate() + 'User request too large, destroying connection.')
                        response.statusCode = 413;
                        request.connection.destroy();
                    } else {
                        //generate the additional data relevant to post
                        let formattedPost = {
                            postID: token(8), 
                            content: recievedData,
                            votes: 1,
                            date: Date.now(),
                        }
                        //echo the formatted post
                        console.log('[INFO]' + printDate() + JSON.stringify(formattedPost))
                        //attempt to write post to database
                        //if an error is encountered, throw status 500
                    }
                    response.statusCode = 201;
                })
                
                break;
            }
            case 'vote' : {
                //check which post the user wishes to vote on
                //check if post exists, and if user has voted on it already
                //TODO: make sure user can undo votes

                if (posts.find(x => x.postID === querystring.decode(request.url, '?').postID)) {
                    switch(querystring.decode(request.url, '?').v) {
                        case 'upvote' : {
                            response.statusCode = 202;

                            break;
                        }
                        case 'downvote' : {
                            response.statusCode = 202;

                            break;
                        }
                        default : {
                            response.statusCode = 403;
                            console.log('invalid operator on vote')
                            break;
                        }
                    }
                } else {
                    console.log('user requested to vote on non-existant post')
                    response.statusCode = 403;
                }

                break;
            }
            default : {
                //default to 400
                console.log('user requested invalid query')
                response.statusCode = 403;
            }
        }
    } 
    response.end();
})

server.listen(port, hostname, () => {
    console.log('[INFO]' + printDate() + `Server running at http://${hostname}:${port}/`); 
})
