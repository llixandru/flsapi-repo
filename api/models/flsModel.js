'use strict'

//OCI
const core = require("oci-core")
const identity = require("oci-identity")
const wr = require("oci-workrequests")
const common = require("oci-common")
const util = require("util")
const RandExp = require('randexp')
const mime = require('mime')
const path = require('path')
const fs = require('fs')

//Freeform tags
const tagKey = "owner"

//OCI configuration
const config = require("./ociConfig")

//Cloud init script
const scriptPath = config.scriptPath

//credentials
const provider = new common.ConfigFileAuthenticationDetailsProvider(
    config.configurationFilePath,
    config.configProfile
)

//identity client
const identityClient = new identity.IdentityClient({
    authenticationDetailsProvider: provider
})

//compute client
const computeClient = new core.ComputeClient({
    authenticationDetailsProvider: provider
})

//virtual network client
const virtualNetworkClient = new core.VirtualNetworkClient({
    authenticationDetailsProvider: provider
})

//worker
const workRequestClient = new wr.WorkRequestClient({
    authenticationDetailsProvider: provider
})

const computeWaiter = computeClient.createWaiters(workRequestClient)

//get the list of availabilityDomains
async function getAvailabilityDomains() {
    try {
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
async function getInstancesInAD(ad, userEmail) {
    try {
        // Create a request and dependent object(s).
        const listInstancesRequest = core.requests.ListInstancesRequest = {
            compartmentId: config.compartmentId,
            availabilityDomain: ad
        };
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
async function getShapesInAD(ad) {
    try {
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
async function provisionInstance(name, shape, ad, userEmail) {
    try {
        //Pick the right Image ID depending on whether the user has selected Standard or GPU VM
        let sourceDetails = ""
        if (shape.includes("GPU")) {
            sourceDetails = {
                sourceType: "image",
                imageId: config.imageIdGPU
            }
        } else {
            sourceDetails = {
                sourceType: "image",
                imageId: config.imageIdCPU
            }
        }

        let pass = generateVNCPassword()
        let data = await base64encodefile(scriptPath)

        const metadata = {
            ssh_authorized_keys: config.publicKeySSH,
            user_data: data,
            myarg_vnc_password: pass,
            myarg_fss_apps: config.appsFss
        }

        const launchInstanceDetails = {
            compartmentId: config.compartmentId,
            availabilityDomain: ad,
            shape: shape,
            displayName: name,
            sourceDetails: sourceDetails,
            createVnicDetails: {
                subnetId: config.subnetId,
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

async function terminateInstance(id) {
    try {
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
async function startInstanceWithId(id) {
    try {
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
async function stopInstanceWithId(id) {
    try {
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
async function getPublicIP(id) {
    try {
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

//Functions for export
async function getInstances(userEmail) {
    const availabilityDomains = await getAvailabilityDomains()
        //AD can be switched here (0, 1 or 2)
    const listInstances = await getInstancesInAD(availabilityDomains[config.AD].name, userEmail)
    return listInstances
}

async function getShapes() {
    const availabilityDomains = await getAvailabilityDomains()
        //AD can be switched here (0, 1 or 2)
    const shapes = await getShapesInAD(availabilityDomains[config.AD].name)
    return shapes
}

async function createInstance(name, shape, userEmail) {
    const availabilityDomains = await getAvailabilityDomains()
        //AD can be switched here (0, 1 or 2)
    const newInstance = await provisionInstance(name, shape, availabilityDomains[config.AD].name, userEmail)
    return newInstance
}

async function deleteInstance(id) {
    const deleteInstance = await terminateInstance(id)
    return deleteInstance
}

async function startInstance(id) {
    const startInst = await startInstanceWithId(id)
    return startInst
}

async function stopInstance(id) {
    const stopInst = await stopInstanceWithId(id)
    return stopInst
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
        const filepath = path.resolve(script);

        // get the mimetype
        const filemime = mime.getType(filepath);

        fs.readFile(filepath, { encoding: 'base64' }, (err, data) => {
            if (err) {
                throw err;
            }
            //console.log(`data:${filemime};base64,${data}`);
            resolve(`${data}`)
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