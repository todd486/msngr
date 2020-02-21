import now from '@now/node';

var actP = [];

export default (req: now.NowRequest, res: now.NowResponse) => {
    res.writeHead(200, { //write header with status 200, allow CORS and set encoding type
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Connection': 'Keep-Alive',
        'Keep-Alive': 'Timeout=5, max=1000' //Keep alive connection for 5 seconds with a max of 1000 requests per connection
    });
    req.setEncoding('utf8');

    function token(length) {
        const validChar = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789';
        let output: string;
        for (let i = 0; i < length; i++) { output += validChar.charAt(Math.floor(Math.random() * validChar.length)) }
        return output;
    }

    const { q = undefined, v = undefined, id = undefined } = req.query; //queries from user

    switch (req.method) {
        case 'GET': {
            switch (q) { //using switch statement for further expandability
                case 'posts': { res.write(JSON.stringify(actP)); res.end(); }
                default: { res.statusCode = 404; res.end(); } /* Not Found */
            }
        }
        case 'POST': {
            function handleData() {
                return new Promise((resolve, reject) => {
                    let body: string; //create temporary value to store body
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
                default: { res.statusCode = 401; res.end(); 
                } //Bad Request
            }
        }
        default: { res.statusCode = 405; res.end(); } //Method Not Supported
    }
    res.end();
}