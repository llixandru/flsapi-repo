var express = require('express'),
    app = express(),
    port = process.env.PORT || 3000,
    //mongoose = require('mongoose'),
    oci = require('./api/models/flsModel'), //created model loading here
    bodyParser = require('body-parser');
var cors = require('cors')
    // mongoose instance connection url connection
    //mongoose.Promise = global.Promise;
    //mongoose.connect('mongodb://localhost/flsdb');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors())

var routes = require('./api/routes/flsRoutes'); //importing route
routes(app); //register the route


app.listen(port);


console.log('RESTful API server started on: ' + port);