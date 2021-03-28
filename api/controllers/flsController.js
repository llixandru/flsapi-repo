'use strict';
//import the OCI tasks model
var oci = require("../models/flsModel")

exports.list_all_instances = function(req, res) {
    oci.getInstances(req.body.region, req.body.instanceOwner).then(result => {
        res.json(result)
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.create_a_new_instance = function(req, res) {
    oci.createInstance(req.body.region, req.body.instanceName, req.body.instanceShape, req.body.instanceOwner).then(instance => {
        res.json(instance);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.delete_an_instance = function(req, res) {
    oci.deleteInstance(req.body.region, req.body.instanceId).then(instance => {
        res.json(instance);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.list_all_shapes_in_ad = function(req, res) {
    oci.getShapes(req.body.region).then(shapes => {
        res.json(shapes);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.start_an_instance = function(req, res) {
    oci.startInstance(req.body.region, req.body.instanceId).then(instance => {
        res.json(instance);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.stop_an_instance = function(req, res) {
    oci.stopInstance(req.body.region, req.body.instanceId).then(instance => {
        res.json(instance);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.get_ip_of_instance = function(req, res) {
    oci.getPublicIP(req.body.region, req.body.instanceId).then(instance => {
        res.json(instance);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.get_regions = function(req, res) {
    oci.getRegions().then(regions => {
        res.json(regions);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.get_current_region = function(req, res) {
    oci.getCurrentRegion().then(region => {
        res.json(region);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};