var express = require('express'),
    app = express(),
    protocol = process.env.PROTOCOL || 'https',
    port = process.env.PORT || '3000',
    host = process.env.HOST || 'localhost',
    bodyParser = require('body-parser'),
    fs = require('fs'),
    cors = require('cors'),
    UserModel = require('./authentication/models/authModel'),
    mongoose = require('mongoose'),
    passport = require('passport')

require('./authentication/controllers/authController')

//Database connect
mongoose.connect("mongodb://127.0.0.1:27017/passport-jwt", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
mongoose.set("useCreateIndex", true)
mongoose.connection.on('error', error => console.log(error))
mongoose.Promise = global.Promise

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())

const routes = require('./authentication/routes/authRoutes')
const secureRoute = require('./api/routes/flsRoutes')

app.use('/', routes)
    // Plug in the JWT strategy as a middleware so only verified users can access this route.
app.use('/oci', passport.authenticate('jwt', { session: false }), secureRoute);

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