import * as now from '@now/node';

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

    const { q = undefined } = req.query; //queries from user

    switch (req.method) {
        case 'GET': {
            switch (q) { //using switch statement for further expandability
                case 'posts': { res.write(JSON.stringify(actP)); break; }
                default: { res.statusCode = 404; } /* Not Found */
            }
            break;
        }
        case 'POST': {
            switch (q) {
                case 'post': {
                    let body = '';
                    req.on('data', (chunk) => {
                        if (chunk.length > 1e6) { //kill the connection if chunk larger than 1e6 bytes (1000000 bytes ~~~ 1MB)
                            console.log(`[WARN] User sent chunk larger than 1MB, destroying connection!`)
                            req.statusCode = 413; //Request too large
                            req.connection.destroy();
                        } else { body += chunk; } //else add the chunk to body
                        req.statusCode = 201; //Accepted
                        let parsedData = JSON.parse(body);
                        let formattedPost = { //Generate the additional data relevant to post
                            id: token(8),
                            content: parsedData.data,
                            date: Date.now(),
                        };
                        actP.push(formattedPost);
                    });
                    break;
                }
                default: { res.statusCode = 401; } //Bad Request
            }
            break;
        }
        default: { res.statusCode = 405; } //Method Not Supported
    }
    res.end();
}