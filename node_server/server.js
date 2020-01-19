const http = require('http');
const querystring = require('querystring');
const hostname = 'localhost';
const port = '8080';
const posts = require('./posts.json')
const fs = require('fs');

//generates a token of random characters of a specific length
function token(length) {
    const validChar = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
    let output = '';
    for (let i = 0; i < length; i++) { output += validChar.charAt(Math.floor(Math.random() * validChar.length)) }
    return output;
}

//store the users who are currently connected in an array
var connectedUsers = []

const server = http.createServer((request, response) => {
    //allow CORS
    response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    response.setHeader("Access-Control-Allow-Origin", "*");

    //GET requests
    if (request.method === 'GET') {
        switch(querystring.decode(request.url, '?').q) {
            case 'init' : {
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
                    //write to response
                    response.write(JSON.stringify(connectedUsers[connectedUsers.findIndex(x => x.userAdress === requesteeAdress)]))
                    //end communications afterwards
                    response.end() 
                } else {
                    //else reply with the token they we're already given.
                    console.log('user with same ip adress found; assumed same user, gave same token')
                    response.end(JSON.stringify(connectedUsers.find(x => x.userAdress === requesteeAdress)))
                }
                break;
            }
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

            }
            default : {
                //default to 404
                response.statusCode = 404;
                response.end();
            }
        }

       
    } 
    //TODO: handle POST requests
    //post example http://localhost:8080/?q=vote&?postID=XXXXXXXX&?v=upvote
    if (request.method === 'POST') {
        //deny request if user isn't initilized
        switch(querystring.decode(request.url, '?').q) {
            case 'send' : {

                response.end()

                break;
            }
            case 'vote' : {
                //check which post the user wishes to vote on
                //check if post exists, and if user has voted on it already

                if (posts.find(x => x.postID === querystring.decode(request.url, '?').postID)) {
                    switch(querystring.decode(request.url, '?').v) {
                        case 'upvote' : {
                            
                            break;
                        }
                        case 'downvote' : {
                            
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
                //default to 404
                console.log('user requested invalid operand')
                response.statusCode = 400;
                response.end();
            }
        }
    } 
})

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`); 
})


  