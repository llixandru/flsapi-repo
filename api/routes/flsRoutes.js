'use strict';
const express = require('express'),
    router = express.Router(),
    fls = require('../controllers/flsController')

// Instance Routes
router.post('/instances', fls.create_a_new_instance)

router.post('/getinstances', fls.list_all_instances)

router.delete('/instances', fls.delete_an_instance)

//Shapes Route
router.post('/shapes', fls.list_all_shapes_in_ad)

//Start Route
router.post('/start', fls.start_an_instance)

//Stop Route
router.post('/stop', fls.stop_an_instance)

//Get Public IP Route
router.post('/publicip', fls.get_ip_of_instance)

//Get Regions
router.get('/regions', fls.get_regions)

//Get Current Region
router.get('/currentregion', fls.get_current_region)

module.exports = router