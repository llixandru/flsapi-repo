var express = require('express'),
    app = express(),
    protocol = process.env.PROTOCOL || 'http',
    port = process.env.PORT || '3000',
    host = process.env.HOST || 'localhost',
    bodyParser = require('body-parser'),
    fs = require('fs'),
    cors = require('cors'),
    jwt = require('express-jwt'),
    jwks = require('jwks-rsa')


let jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://dev-bbijppeg.eu.auth0.com/.well-known/jwks.json'
    }),
    audience: 'http://localhost:3000',
    issuer: 'https://dev-bbijppeg.eu.auth0.com/',
    algorithms: ['RS256']
})

app.use(jwtCheck)
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())

const secureRoute = require('./api/routes/flsRoutes')

app.use('/oci', secureRoute);

let server

// Start a development HTTPS server.
if (protocol === 'https') {
    const { execSync } = require('child_process');
    const execOptions = { encoding: 'utf-8', windowsHide: true };
    let key = './certs/key.pem';
    let certificate = './certs/certificate.pem';

    if (!fs.existsSync(key) || !fs.existsSync(certificate)) {
        try {
            execSync('openssl version', execOptions);
            execSync(
                `openssl req -x509 -newkey rsa:2048 -keyout ./certs/key.tmp.pem -out ${ certificate } -days 365 -nodes -subj "/C=US/ST=Foo/L=Bar/O=Baz/CN=localhost"`,
                execOptions
            );
            execSync(`openssl rsa -in ./certs/key.tmp.pem -out ${ key }`, execOptions);
            execSync('rm ./certs/key.tmp.pem', execOptions);
        } catch (error) {
            console.error(error);
        }
    }

    const options = {
        key: fs.readFileSync(key),
        cert: fs.readFileSync(certificate),
        passphrase: 'password'
    };

    server = require('https').createServer(options, app);

} else {
    server = require('http').createServer(app);
}

server.listen({ port, host }, function() {
    console.log('RESTful API server started on: ' + port);
})