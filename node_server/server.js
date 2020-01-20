const http = require('http');
const querystring = require('querystring');
const hostname = 'localhost';
const port = '8080';
const posts = require('./posts.json')
const filesystem = require('fs');

//generates a token of random characters of a specific length
function token(length) {
    const validChar = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
    let output = '';
    for (let i = 0; i < length; i++) { output += validChar.charAt(Math.floor(Math.random() * validChar.length)) }
    return output;
}

//store the users who are currently connected in an array
var connectedUsers = []

//TODO: manage posts and handle POST requests
const server = http.createServer((request, response) => {
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
            console.log(connectedUsers.find(x => x.userAdress === requesteeAdress))

            //write to response and end comm
            response.end(JSON.stringify(connectedUsers[connectedUsers.findIndex(x => x.userAdress === requesteeAdress)]))
        } else {
            //else reply with the token they we're already given.
            console.log('user with same ip adress found; assumed same user, gave same token')
            response.end(JSON.stringify(connectedUsers.find(x => x.userAdress === requesteeAdress)))
        }
    }

    //allow CORS
    response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    response.setHeader("Access-Control-Allow-Origin", "*");

    //GET requests
    if (request.method === 'GET') {
        switch(querystring.decode(request.url, '?').q) {
            case 'init' : { init(); break; } //initialize user 
            case 'gettop' : {
                //get most popular 128 posts for the day
                response.writeHead(200, {
                    'Content-Type': 'application/json',
                });

                response.end(JSON.stringify(posts))
                break;
            }   
            case 'getnew' : {
                //stream in new posts as they come in
                response.writeHead(200, {
                    'Content-Type': 'application/json',
                });

                response.end('get new')
                break;
            }
            default : {
                //default to 404
                response.statusCode = 404;
                response.end();
            }
        }
    } 
    //handle POST requests; example http://localhost:8080/?q=vote&?postID=XXXXXXXX&?v=upvote
    //TODO: handle spam requests
    if (request.method === 'POST') {
        //deny request if user isn't initilized
        if (connectedUsers.find(x => x.userAdress === response.connection.address) === false) { console.log("uninititialized user detected"); init(); }

        //print what any user has requested.
        console.log("received query: ")
        console.log(querystring.decode(request.url, '?'))

        switch(querystring.decode(request.url, '?').q) {
            case 'send' : {
                let recievedData = '';
                request.on('data', (data) => {
                    recievedData += data
                    //kill the connection if user tries to send a message longer than 1e6 bytes (1000000 bytes ~~~ 1MB)
                    if (data.length > 1e6) {
                        request.connection.destroy();
                    } else {
                        console.log(recievedData)
                        //generate the additional data relevant to post
                        let formattedPost = {
                            postID: token(8), 
                            content: recievedData,
                            votes: 1,
                            date: Date.now(),
                        }
                        console.log(formattedPost)
                    }
                })

                response.writeHead(200, {})
                response.end(recievedData)

                break;
            }
            case 'vote' : {
                //check which post the user wishes to vote on
                //check if post exists, and if user has voted on it already
                //TODO: make sure user can undo votes

                if (posts.find(x => x.postID === querystring.decode(request.url, '?').postID)) {
                    switch(querystring.decode(request.url, '?').v) {
                        case 'upvote' : {
                            //write to database the updated 
                            response.end()
                            break;
                        }
                        case 'downvote' : {
                            response.statusCode = 200;
                            response.end()
                            break;
                        }
                        default : {
                            response.statusCode = 200;
                            response.end()
                            break;
                        }
                    }

                } else {
                    console.log('user requested to vote on non-existant post')
                    response.statusCode = 400;
                    response.end()
                }

                break;
            }
            default : {
                //default to 400
                console.log('user requested invalid query')
                response.statusCode = 400;
                response.end();
            }
        }
    } 
})

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`); 
})


  