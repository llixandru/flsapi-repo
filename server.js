var express = require('express'),
    app = express(),
    port = process.env.PORT || 3000,
    protocol = process.env.PROTOCOL || 'https',
    oci = require('./api/models/flsModel'), //created model loading here
    bodyParser = require('body-parser');
var cors = require('cors')


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors())

var routes = require('./api/routes/flsRoutes'); //importing route
routes(app); //register the route


app.listen(port);


console.log('RESTful API server started on: ' + port);