'use strict';
//import the OCI tasks model
var oci = require("../models/flsModel")

exports.list_all_instances = function(req, res) {
    let owner = req.body.instanceOwner
    oci.getInstances(owner).then(instances => {
        res.json(instances)
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.create_a_new_instance = function(req, res) {
    let new_instance = req.body
    oci.createInstance(new_instance.instanceName, new_instance.instanceShape, new_instance.instanceOwner).then(instance => {
        res.json(instance);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.delete_an_instance = function(req, res) {
    oci.deleteInstance(req.params.InstanceId).then(instance => {
        res.json(instance);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.list_all_shapes_in_ad = function(req, res) {
    oci.getShapes().then(shapes => {
        res.json(shapes);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.start_an_instance = function(req, res) {
    oci.startInstance(req.params.InstanceId).then(instance => {
        res.json(instance);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.stop_an_instance = function(req, res) {
    oci.stopInstance(req.params.InstanceId).then(instance => {
        res.json(instance);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};

exports.get_ip_of_instance = function(req, res) {
    oci.getPublicIP(req.params.InstanceId).then(instance => {
        res.json(instance);
    }, error => {
        res.status(409).json({
            status: false,
            error: error
        })
    })
};