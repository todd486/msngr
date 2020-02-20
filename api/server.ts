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
        'Access-Control-Allow-Origin': 'https://msngr.now.sh/',
        'Content-Type': 'application/json',
        'Connection': 'Keep-Alive',
        'Keep-Alive': 'Timeout=5, max=1000' //Keepalive connection for 5 seconds with a max of 1000 requests per connection
    });
    req.setEncoding('utf8');

    const { q = undefined } = req.query;

    if (true) {
        switch (req.method) {
            case 'GET': {
                switch (q) { //using switch statement for further expandablity
                    case 'posts': { res.write(JSON.stringify(actP)); }
                    default: { res.statusCode = 404; res.end(); } /* Not Found */
                }
            }
            case 'POST': {
                switch (q) {
                    case 'post': {
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
                    }
                }
            }
            default: { res.statusCode = 405; res.end(); } //Method Not Supported
        }
    } else { res.statusCode = 401; res.end(); } //Forbidden

    req.once('end', () => {
        req.connection.destroy(); //destroy connection if user requests it
    })
}