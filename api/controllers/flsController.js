'use strict';
//import the OCI tasks model
var oci = require("../models/flsModel")

exports.list_all_instances = function(req, res) {
    oci.getInstances().then(instances => {
        res.json(instances);
    })
};

exports.create_a_new_instance = function(req, res) {
    let new_instance = req.body
    oci.createInstance(new_instance.instanceName, new_instance.instanceShape).then(instance => {
        res.json(instance);
    })
};

exports.delete_an_instance = function(req, res) {
    oci.deleteInstance(req.params.InstanceId).then(instance => {
        res.json(instance);
    })
};

exports.list_all_shapes_in_ad = function(req, res) {
    oci.getShapes().then(shapes => {
        res.json(shapes);
    })
};

exports.start_an_instance = function(req, res) {
    oci.startInstance(req.params.InstanceId).then(instance => {
        res.json(instance);
    })
};

exports.stop_an_instance = function(req, res) {
    oci.stopInstance(req.params.InstanceId).then(instance => {
        res.json(instance);
    })
};

exports.get_ip_of_instance = function(req, res) {
    oci.getPublicIP(req.params.InstanceId).then(instance => {
        res.json(instance);
    })
};