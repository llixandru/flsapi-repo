'use strict';
const express = require('express'),
    router = express.Router(),
    fls = require('../controllers/flsController')

// Instance Routes
router.post('/instances', fls.create_a_new_instance)

router.post('/getinstances', fls.list_all_instances)

router.delete('/instances/:InstanceId', fls.delete_an_instance)

//Shapes Route
router.get('/shapes', fls.list_all_shapes_in_ad)

//Start Route
router.get('/start/:InstanceId', fls.start_an_instance)

//Stop Route
router.get('/stop/:InstanceId', fls.stop_an_instance)

//Get Public IP Route
router.get('/publicip/:InstanceId', fls.get_ip_of_instance)

//Get Regions
router.get('/regions', fls.get_regions)

//Change Region
router.post('/regions', fls.change_regions)

//Get Current Region
router.get('/currentregion', fls.get_current_region)

module.exports = router