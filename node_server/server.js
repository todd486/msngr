const http = require('http');
const querystring = require('querystring');
const cors = require('cors')
// const assert = require('assert');
// const mongoclient = require('mongodb').MongoClient;

const posts = require('./posts.json')

//values related to where and how server is hosted
const hostname = 'localhost';
const port = '8080';
// const databaseurl = `mongodb://${hostname}:27017/`;

//database related
// const databasename = 'posts'
// const client = new mongoclient(databaseurl)

function printTime() { return ("<" + new Date(Date.now()).toLocaleTimeString() + "> ")}

//stream related
// let resultStream = '';
// const wStream = new WritableStream({
//     write(chunk) {
//         return new Promise((resolve, reject) => {
//             //create a new buffer where each 'view[0]' is equal to a chunk.
//             let buffer = new ArrayBuffer(2); let view = new Uint16Array(buffer); view[0] = chunk;

//             let decoded = (new TextDecoder('utf-8')).decode(view, { stream : true }); resultStream += decoded;
            
//             resolve();
//         })
//     },
//     close() {
//         return resultStream;
//     },
//     abort(err) {
//         console.log("[ERROR]" + printTime() + "Sink error: " + err)
//     }
// }, (new CountQueuingStrategy({ highWaterMark: 1 })))
// const defaultWriter = stream.getWriter();


//TODO: session checking, ssl?
const server = http.createServer(async(request, response) => {
    response.writeHead(200, { //write header with status 200; allow CORS
        'Access-Control-Allow-Origin' : '*',
        'Content-Type': 'application/json',
    })

    //server functions
    function token(length) { //generates a token of random characters of a specific length
        const validChar = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
        let output = '';
        for (let i = 0; i < length; i++) { output += validChar.charAt(Math.floor(Math.random() * validChar.length)) }
        return output;
    }
    // async function writeStream(data, stream) {
    //     const encodedData = (new TextEncoder()).encode(data, { stream : true });
    //     encodedData.forEach((chunk) => {
    //         defaultWriter.ready
    //         .then(() => {
    //             return defaultWriter.write(chunk);
    //         })
    //         .then(() => {
    //             console.log("[INFO]" + printTime() + "Wrote chunk to sink.")
    //         })
    //         .catch((err) => {
    //             console.log("[ERROR]" + printTime() + "Error writing to sink: " + err)
    //         })
    //     })
    //     defaultWriter.ready
    //     .then(() => {
    //         defaultWriter.close()
    //     })
    //     .then(() => {
    //         console.log("[INFO]" + printTime() + "All chunks written.")
    //     })
    //     .catch((err) => {
    //         console.log("[ERROR]" + printTime() + "Stream error:  " + err)
    //     })
    // }

    //GET requests
    if (request.method === 'GET') {
        console.log('[INFO]' + printTime() + 'Received GET query:' + JSON.stringify(querystring.decode(request.url, '?')) )

        switch(querystring.decode(request.url, '?').q) {

            //switch this out for a single command to stream all the messages and sort them client side.
            case 'gettop' : {
                //get most popular 128 posts for the day
                //TODO: stream these messages
                //console.log(writeStream('testing', wStream));
                response.write(JSON.stringify(posts))

                break;
            }   
            case 'getnew' : {
                //TODO: stream in new posts as they come in

                break;
            }
            default : { response.statusCode = 404; }
        }
    } 

    //TODO: Implement spam protections and more bad actor protections
    if (request.method === 'POST') {
        //print what any user has requested.
        console.log('[INFO]' + printTime() + 'Received POST query:' + JSON.stringify(querystring.decode(request.url, '?')) )

        switch(querystring.decode(request.url, '?').q) {
            case 'post' : {
                let recievedData = ''; //create temporary value to store data

                request.on('data', (data) => {
                    recievedData += data;
                    if (data.length > 1e6) { //kill the connection if user tries to send a message longer than 1e6 bytes (1000000 bytes ~~~ 1MB)
                        console.log('[WARN]' + printTime() + 'User request too large, destroying connection.')
                        response.statusCode = 413; //Request too large
                        request.connection.destroy();
                    } 
                    response.statusCode = 201; //Accepted
                    let formattedData = JSON.parse(recievedData); //parse the transfer stringified json
                    
                    let formattedPost = {
                        postID: token(8), 
                        content: formattedData.data,
                        votes: 1,
                        date: Date.now(),
                    } //generate the additional data relevant to post

                    console.log('[INFO]' + printTime() + JSON.stringify(formattedPost)) //echo the formatted post
                    //attempt to write post to database
                    //if an error is encountered, throw status 500
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
                console.log('[WARN]' + printTime() + "User requested invalid query. (If this request wasn't made through the client, ignore this.)")
                response.statusCode = 403; //default to 403
            }
        }
    } 
    response.end(); //once all possible actions could have been taken, end communication
})

server.listen(port, hostname, () => {
    console.log('[INFO]' + printTime() + `Server running at http://${hostname}:${port}/`); 
})
