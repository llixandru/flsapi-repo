'use strict'

//OCI
const core = require("oci-core"),
    identity = require("oci-identity"),
    wr = require("oci-workrequests"),
    objectstorage = require("oci-objectstorage"),
    common = require("oci-common"),
    RandExp = require('randexp'),
    mime = require('mime'),
    path = require('path'),
    fs = require('fs'),
    images = require('../config/images.json'),
    subnets = require('../config/subnets.json'),
    appsFss = require('../config/fss.json'),
    config = require("../config/ociConfig"),
    ads = require("../config/ad.json"),
    tagKey = "owner"

//Cloud init script
const scriptPath = config.scriptPath

//credentials
const provider = new common.ConfigFileAuthenticationDetailsProvider(
    config.configurationFilePath,
    config.configProfile
)

//Get namespace
async function getOsNamespace() {
    try {
        //object storage client
        const objectStorageClient = new objectstorage.ObjectStorageClient({
                authenticationDetailsProvider: provider
            })
            // Create a request and dependent object(s).
        const request = (objectstorage.requests.GetNamespaceRequest = {
            compartmentId: config.compartmentId
        })
        const response = await objectStorageClient.getNamespace(request)
        return response.value
    } catch (error) {
        console.log("getNamespace failed with error  " + error)
        throw error
    }
}

//Get available regions
async function getRegionsInTenant() {
    try {
        //identity
        const identityClient = new identity.IdentityClient({
                authenticationDetailsProvider: provider
            })
            // Create a request and dependent object(s).
        const listRegionSubscriptionsRequest = identity.requests.ListRegionSubscriptionsRequest = {
            tenancyId: config.tenancyId
        }

        // Send request to the Client.
        const listRegionSubscriptionsResponse = await identityClient.listRegionSubscriptions(
            listRegionSubscriptionsRequest
        )

        return listRegionSubscriptionsResponse
    } catch (error) {
        console.log("listRegions Failed with error  " + error)
    }
}

//Get the list of availabilityDomains
async function getAvailabilityDomains(region) {
    try {
        //identity
        const identityClient = new identity.IdentityClient({
                authenticationDetailsProvider: provider
            })
            //Get region property
        let reg = region.toUpperCase()
        reg = reg.replace(/-/g, '_')

        //Set the new region on clients
        identityClient.region = common.Region[reg]

        const request = identity.requests.ListAvailabilityDomainsRequest = {
            compartmentId: config.compartmentId
        }

        const response = await identityClient.listAvailabilityDomains(request)
        return response.items
    } catch (error) {
        console.log("getAvailabilityDomains failed with error  " + error);
        throw error
    }
}

//get instances
async function getInstancesInAD(region, ad, userEmail) {
    try {
        //compute client
        const computeClient = new core.ComputeClient({
                authenticationDetailsProvider: provider
            })
            //Get region property
        let reg = region.toUpperCase()
        reg = reg.replace(/-/g, '_')

        //Set the new region on clients
        computeClient.region = common.Region[reg]

        // Create a request and dependent object(s).
        const listInstancesRequest = core.requests.ListInstancesRequest = {
                compartmentId: config.compartmentId,
                availabilityDomain: ad
            }
            // Send request to the Client.
        const listInstancesResponse = await computeClient.listInstances(listInstancesRequest)
        let instancesNotTerminated = new Array
            // Filter the instances not TERMINATING or TERMINATED and belonging to current user
        for (let instance of listInstancesResponse.items) {
            if (
                instance.freeformTags[tagKey] === userEmail &&
                !instance.lifecycleState.includes("TERMIN")
            ) {
                instancesNotTerminated.push(instance);
            }
        }

        return instancesNotTerminated
    } catch (error) {
        console.log("listInstances failed with error  " + error);
        throw error
    }
}

//get shapes for a specific AD
async function getShapesInAD(region, ad) {
    try {
        //compute client
        const computeClient = new core.ComputeClient({
                authenticationDetailsProvider: provider
            })
            //Get region property
        let reg = region.toUpperCase()
        reg = reg.replace(/-/g, '_')

        //Set the new region on clients
        computeClient.region = common.Region[reg]

        // Create a request and dependent object(s).
        const request = core.requests.ListShapesRequest = {
            availabilityDomain: ad,
            compartmentId: config.compartmentId
        };

        const response = await computeClient.listShapes(request)
        let availableShapes = new Array

        //Filter the shapes by those starting with "VM"
        for (let shape of response.items) {
            if (!shape.shape.includes("Flex")) {
                availableShapes.push(shape)
            }
        }
        return availableShapes
    } catch (error) {
        console.log("getShapes failed with error  " + error);
        throw error
    }
}

//create new instance
async function provisionInstance(region, name, shape, ad, userEmail) {
    try {
        //compute client
        const computeClient = new core.ComputeClient({
                authenticationDetailsProvider: provider
            })
            //worker
        const workRequestClient = new wr.WorkRequestClient({
                authenticationDetailsProvider: provider
            })
            //compute waiter
        const computeWaiter = computeClient.createWaiters(workRequestClient)

        //Get region property
        let reg = region.toUpperCase()
        reg = reg.replace(/-/g, '_')

        //Set the new region on clients
        computeClient.region = common.Region[reg]
        workRequestClient.region = common.Region[reg]


        //Pick the right Image depending on whether the user has selected Standard or GPU VM
        let sourceDetails = ""

        if (shape.includes("GPU")) {
            sourceDetails = {
                sourceType: "image",
                imageId: images[region].GPU
            }
        } else {
            sourceDetails = {
                sourceType: "image",
                imageId: images[region].CPU
            }
        }

        let pass = generateVNCPassword()
        let data = await base64encodefile(scriptPath)

        let namespace = await getOsNamespace()

        const metadata = {
            ssh_authorized_keys: config.publicKeySSH,
            user_data: data,
            myarg_vnc_password: pass,
            myarg_fss_apps: appsFss[region],
            myarg_bucket: config.bucketName,
            myarg_access_key: config.accessKey,
            myarg_secret_key: config.secretKey,
            myarg_os_namespace: namespace
        }

        const launchInstanceDetails = {
            compartmentId: config.compartmentId,
            availabilityDomain: ad,
            shape: shape,
            displayName: name,
            sourceDetails: sourceDetails,
            createVnicDetails: {
                subnetId: subnets[region]
            },
            metadata: metadata,
            freeformTags: { "owner": userEmail }
        }

        //launch the provisioning request
        const launchInstanceRequest = {
            launchInstanceDetails: launchInstanceDetails
        }

        //submit the new instance creation
        const launchInstanceResponse = await computeClient.launchInstance(launchInstanceRequest)

        //wait for instance to be in RUNNING status
        const getInstanceRequest = {
            instanceId: launchInstanceResponse.instance.id
        }

        const getInstanceResponse = await computeWaiter.forInstance(getInstanceRequest, core.models.Instance.LifecycleState.Running)

        const instanceId = getInstanceResponse.instance.id

        let returnValue = { "instanceId": instanceId, "password": pass }

        return returnValue

    } catch (error) {
        console.log("provisionInstance failed with error  " + error);
        throw error
    }
}

//Terminate an instance
async function terminateInstance(region, id) {
    try {
        //compute client
        const computeClient = new core.ComputeClient({
            authenticationDetailsProvider: provider
        })

        //Get region property
        let reg = region.toUpperCase()
        reg = reg.replace(/-/g, '_')

        //Set the new region on clients
        computeClient.region = common.Region[reg]

        // Create a request and dependent object(s).
        const terminateInstanceRequest = core.requests.TerminateInstanceRequest = {
            instanceId: id,
            preserveBootVolume: false
        }

        // Send request to the Client.
        const terminateInstanceResponse = await computeClient.terminateInstance(terminateInstanceRequest)
        return terminateInstanceResponse
    } catch (error) {
        console.log("terminateInstance failed with error  " + error);
        throw error
    }
}

//Start an instance
async function startInstanceWithId(region, id) {
    try {
        //compute client
        const computeClient = new core.ComputeClient({
                authenticationDetailsProvider: provider
            })
            //worker
        const workRequestClient = new wr.WorkRequestClient({
                authenticationDetailsProvider: provider
            })
            //compute waiter
        const computeWaiter = computeClient.createWaiters(workRequestClient)

        //Get region property
        let reg = region.toUpperCase()
        reg = reg.replace(/-/g, '_')

        //Set the new region on clients
        computeClient.region = common.Region[reg]
        workRequestClient.region = common.Region[reg]

        const startInstanceRequest = core.requests.InstanceActionRequest = {
            instanceId: id,
            action: "START"
        }
        const startInstanceResponse = await computeClient.instanceAction(startInstanceRequest)
            //wait for instance to be in STARTED status
        const getInstanceRequest = {
            instanceId: startInstanceResponse.instance.id
        }

        const getInstanceResponse = await computeWaiter.forInstance(getInstanceRequest, core.models.Instance.LifecycleState.Running)
        return getInstanceResponse.instance.id
    } catch (error) {
        console.log("startInstance failed with error  " + error);
        throw error
    }
}

//Stop an instance
async function stopInstanceWithId(region, id) {
    try {
        //compute client
        const computeClient = new core.ComputeClient({
                authenticationDetailsProvider: provider
            })
            //worker
        const workRequestClient = new wr.WorkRequestClient({
                authenticationDetailsProvider: provider
            })
            //compute waiter
        const computeWaiter = computeClient.createWaiters(workRequestClient)

        //Get region property
        let reg = region.toUpperCase()
        reg = reg.replace(/-/g, '_')

        //Set the new region on clients
        computeClient.region = common.Region[reg]
        workRequestClient.region = common.Region[reg]

        const stopInstanceRequest = core.requests.InstanceActionRequest = {
            instanceId: id,
            action: "SOFTSTOP"
        }
        const stopInstanceResponse = await computeClient.instanceAction(stopInstanceRequest)
            //wait for instance to be in STOPPED status
        const getInstanceRequest = {
            instanceId: stopInstanceResponse.instance.id
        }

        const getInstanceResponse = await computeWaiter.forInstance(getInstanceRequest, core.models.Instance.LifecycleState.Stopped)
        return getInstanceResponse.instance.id
    } catch (error) {
        console.log("stopInstance failed with error  " + error);
        throw error
    }
}

//Get Public IP of instance
async function getPublicIP(region, id) {
    try {
        //compute client
        const computeClient = new core.ComputeClient({
                authenticationDetailsProvider: provider
            })
            //virtual network client
        const virtualNetworkClient = new core.VirtualNetworkClient({
            authenticationDetailsProvider: provider
        })

        //Get region property
        let reg = region.toUpperCase()
        reg = reg.replace(/-/g, '_')

        //Set the new region on clients
        computeClient.region = common.Region[reg]
        virtualNetworkClient.region = common.Region[reg]

        const listVnicAttachmentsRequest = {
            compartmentId: config.compartmentId,
            instanceId: id
        }

        const listVnicAttachmentsResponse = await computeClient.listVnicAttachments(listVnicAttachmentsRequest)
        const vnicId = listVnicAttachmentsResponse.items[0].vnicId

        const listPrivateIpsRequest = {
            vnicId: vnicId
        }

        const listPrivateIpsResponse = await virtualNetworkClient.listPrivateIps(listPrivateIpsRequest)

        const privateIpId = listPrivateIpsResponse.items[0].id

        const getPublicIpByPrivateIpIdDetails = {
            privateIpId: privateIpId
        };
        const getPublicIpByPrivateIpIdRequest = {
            getPublicIpByPrivateIpIdDetails: getPublicIpByPrivateIpIdDetails,
        }

        const getPublicIpByPrivateIpIdResponse = await virtualNetworkClient.getPublicIpByPrivateIpId(getPublicIpByPrivateIpIdRequest)

        const publicIP = getPublicIpByPrivateIpIdResponse.publicIp.ipAddress
        return publicIP
    } catch (error) {
        console.log("getPublicIP failed with error  " + error);
        throw error
    }
}

//Get image ID
async function getImage(name) {
    //compute client
    const computeClient = new core.ComputeClient({
        authenticationDetailsProvider: provider
    })
    const request = core.requests.ListImagesRequest = {
        compartmentId: config.compartmentId,
        displayName: name
    }

    const response = await computeClient.listImages(request)
    return response.items[0].id
}

//Functions for export
async function getRegions() {
    const listRegions = await getRegionsInTenant()
    return listRegions
}

async function getInstances(region, userEmail) {
    const availabilityDomains = await getAvailabilityDomains(region)
    const ad = ads[region]
    const listInstances = await getInstancesInAD(region, availabilityDomains[ad].name, userEmail)
    return listInstances
}

async function getShapes(region) {
    const availabilityDomains = await getAvailabilityDomains(region)
    const ad = ads[region]
    const shapes = await getShapesInAD(region, availabilityDomains[ad].name)
    return shapes
}

async function createInstance(region, name, shape, userEmail) {
    const availabilityDomains = await getAvailabilityDomains(region)
    const ad = ads[region]
    const newInstance = await provisionInstance(region, name, shape, availabilityDomains[ad].name, userEmail)
    return newInstance
}

async function deleteInstance(region, id) {
    const deleteInstance = await terminateInstance(region, id)
    return deleteInstance
}

async function startInstance(region, id) {
    const startInst = await startInstanceWithId(region, id)
    return startInst
}

async function stopInstance(region, id) {
    const stopInst = await stopInstanceWithId(region, id)
    return stopInst
}

//Get current region
async function getCurrentRegion() {
    let region = await getRegionFromConfig()
    return region
}

//helper functions

//generate password with 2 uppercase characters, 2 lowercase characters, 6 random characters and 2 special characters
const generateVNCPassword = () => {
    return new RandExp(/^([A-Z]{2}[a-z]{2}[a-zA-Z]{6}[#_-]{2})$/).gen()
}

//Base64 encode the Cloud init script
function base64encodefile(script) {
    return new Promise((resolve, reject) => {
        // path to the file we passed in
        const filepath = path.resolve(script)

        // get the mimetype
        const filemime = mime.getType(filepath)

        fs.readFile(filepath, { encoding: 'base64' }, (err, data) => {
            if (err) {
                throw err;
            }
            //console.log(`data:${filemime};base64,${data}`);
            resolve(`${data}`)
        })
    })
}

//change the region in the config file to re-register the provider on the new region
function changeRegionInConfigFile(region) {
    return new Promise((resolve, reject) => {
        const filepath = path.resolve(config.configFileForFsWrite)
        fs.readFile(filepath, 'utf8', function(err, data) {
            if (err) {
                return console.log(err)
            }

            let searchString = 'region';
            let re = new RegExp('^.*' + searchString + '.*$', 'gm');
            let formatted = data.replace(re, 'region=' + region);

            fs.writeFile(filepath, formatted, 'utf8', function(err) {
                resolve(region)
                if (err) return console.log(err)
            })
        })
    })
}

//return current region from the config file
function getRegionFromConfig() {
    return new Promise((resolve, reject) => {
        const filepath = path.resolve(config.configFileForFsWrite)
        fs.readFile(filepath, 'utf8', function(err, data) {
            if (err) {
                return console.log(err)
            }

            let searchString = 'region=';
            let re = new RegExp('^.*' + searchString + '.*$', 'gm')
            let string = data.match(re)[0]
            string = string.split('=')[1]
            resolve(string)
        })
    })
}

//Function exports
module.exports.getInstances = getInstances
module.exports.getShapes = getShapes
module.exports.createInstance = createInstance
module.exports.deleteInstance = deleteInstance
module.exports.startInstance = startInstance
module.exports.stopInstance = stopInstance
module.exports.getPublicIP = getPublicIP
module.exports.getRegions = getRegions
module.exports.getCurrentRegion = getCurrentRegion