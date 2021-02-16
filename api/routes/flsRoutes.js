'use strict';
module.exports = function(app) {
    var fls = require('../controllers/flsController');

    // Instance Routes
    app.route('/instances')
        .post(fls.create_a_new_instance)

    app.route('/getinstances')
        .post(fls.list_all_instances)

    app.route('/instances/:InstanceId')
        .delete(fls.delete_an_instance)

    //Shapes Route
    app.route('/shapes')
        .get(fls.list_all_shapes_in_ad)

    //Start Route
    app.route('/start/:InstanceId')
        .get(fls.start_an_instance)

    //Stop Route
    app.route('/stop/:InstanceId')
        .get(fls.stop_an_instance)

    //Get Public IP Route
    app.route('/publicip/:InstanceId')
        .get(fls.get_ip_of_instance)
};