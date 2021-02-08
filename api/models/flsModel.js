'use strict'

//OCI
const core = require("oci-core")
const identity = require("oci-identity")
const wr = require("oci-workrequests")
const common = require("oci-common")
const util = require("util")

//Config
const configurationFilePath = "~/.oci/config" //OCI config file
const configProfile = "LIANA" //profile name
const compartmentId = "ocid1.compartment.oc1..aaaaaaaa5uzjzuf3qwxayfc2pmjankhmygjus2sjgnrd3g47jxvyom3pu7va" //compartment ID
const subnetId = "ocid1.subnet.oc1.eu-frankfurt-1.aaaaaaaah7dauwx2fyvch4zny7oplhr4unppjvjr2zj77trjlbedqbqibgha" //subnet ID
const imageId =
    "ocid1.image.oc1.eu-frankfurt-1.aaaaaaaa5w2lrmsn6wpjn7fbqv55curiarwsryqhoj4dw5hsixrl37hrinja"

const publicKeySSH = "ssh-rsa MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsh/1dig1DU0FoLD/WM1323Q12y0simMjFEzyo/WjYomMHgvMCjRNhzpjVGwo2ckk6CR0aiVLbPYkw72v2S0SN0BCos2T7ysjVz+lJt3JnJHuArAdy63L5G3Hs+nsHTfshyC5x+WWxlFaYhmIx1RkdYolXXqzGxcMtKizskwrevz8NoZRmax+pYm5G5L8x/QTCHyiXADFuDlq72LlRBeEH72eY+SleP/+RbSjsZn4R7/RMZuZ03jJKGSS8hmYX+fg/5pVI7l/XpVUnSQZz3rBfR43VNMnYuRqHGCidhf9dHb7LisW/WCj+cJyhMwCjV/rywaGCrE8dyYpow35/FRoVwIDAQAB" //public key
    //const AD = "0"; //In Frankfurt, can be 0, 1 or 2

//credentials
const provider = new common.ConfigFileAuthenticationDetailsProvider(
    configurationFilePath,
    configProfile
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
    authenticationDetailsProvider: provider,
})

//worker
const workRequestClient = new wr.WorkRequestClient({
    authenticationDetailsProvider: provider,
})

const computeWaiter = computeClient.createWaiters(workRequestClient);

//get the list of availabilityDomains
async function getAvailabilityDomains() {
    try {
        const request = identity.requests.ListAvailabilityDomainsRequest = {
            compartmentId: compartmentId
        }

        const response = await identityClient.listAvailabilityDomains(request)
        return response.items
    } catch (error) {
        console.log("getAvailabilityDomains failed with error  " + error);
        return error
    }
}

//get instances
async function getInstancesInAD(ad) {
    try {
        // Create a request and dependent object(s).
        const listInstancesRequest = core.requests.ListInstancesRequest = {
            compartmentId: compartmentId,
            availabilityDomain: ad
        };
        // Send request to the Client.
        const listInstancesResponse = await computeClient.listInstances(listInstancesRequest)
        let instancesNotTerminated = new Array

        //Filter the instances not TERMINATING or TERMINATED
        for (let instance of listInstancesResponse.items) {
            if (!instance.lifecycleState.includes("TERM")) {
                instancesNotTerminated.push(instance)
            }
        }

        return instancesNotTerminated
    } catch (error) {
        console.log("listInstances failed with error  " + error);
        return error
    }
}

//get shapes for a specific AD
async function getShapesInAD(ad) {
    try {
        // Create a request and dependent object(s).
        const request = core.requests.ListShapesRequest = {
            availabilityDomain: ad,
            compartmentId: compartmentId
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
        return error
    }
}

//create new instance
async function provisionInstance(name, shape, ad) {
    try {
        const sourceDetails = {
            sourceType: "image",
            imageId: imageId
        }

        const metadata = {
            ssh_authorized_keys: publicKeySSH
        }

        const launchInstanceDetails = {
            compartmentId: compartmentId,
            availabilityDomain: ad,
            shape: shape,
            displayName: name,
            sourceDetails: sourceDetails,
            createVnicDetails: {
                subnetId: subnetId,
            },
            metadata: metadata
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

        return instanceId

    } catch (error) {
        console.log("provisionInstance failed with error  " + error);
        return error
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
        return error
    }
}

//Start an instance
async function startInstance(id) {
    const startInstanceRequest = core.requests.InstanceActionRequest = {
        instanceId: id,
        action: core.requests.InstanceActionRequest.Action.Start
    }
    const startInstanceResponse = await computeClient.instanceAction(startInstanceRequest)
        //wait for instance to be in STARTED status
    const getInstanceRequest = {
        instanceId: startInstanceResponse.instance.id
    }

    const getInstanceResponse = await computeWaiter.forInstance(getInstanceRequest, core.models.Instance.LifecycleState.Start)
    return getInstanceResponse.instance.id
}

//Stop an instance
async function stopInstance(id) {
    const stopInstanceRequest = core.requests.InstanceActionRequest = {
        instanceId: id,
        action: core.requests.InstanceActionRequest.Action.Softstop
    }
    const stopInstanceResponse = await computeClient.instanceAction(stopInstanceRequest)
        //wait for instance to be in STOPPED status
    const getInstanceRequest = {
        instanceId: stopInstanceResponse.instance.id
    }

    const getInstanceResponse = await computeWaiter.forInstance(getInstanceRequest, core.models.Instance.LifecycleState.Stopped)
    return getInstanceResponse.instance.id
}

//Get Public IP of instance
async function getPublicIP(id) {

    const listVnicAttachmentsRequest = {
        compartmentId: compartmentId,
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
}

//Functions for export
async function getInstances() {
    const availabilityDomains = await getAvailabilityDomains()
        //AD can be switched here (0, 1 or 2)
    const listInstances = await getInstancesInAD(availabilityDomains[0].name)
    return listInstances
}

async function getShapes() {
    const availabilityDomains = await getAvailabilityDomains()
        //AD can be switched here (0, 1 or 2)
    const shapes = await getShapesInAD(availabilityDomains[0].name)
    return shapes
}

async function createInstance(name, shape) {
    const availabilityDomains = await getAvailabilityDomains()
        //AD can be switched here (0, 1 or 2)
    const newInstance = await provisionInstance(name, shape, availabilityDomains[0].name)
    return newInstance
}

async function deleteInstance(id) {
    const deleteInstance = await terminateInstance(id)
    return deleteInstance
}

//Function exports
module.exports.getInstances = getInstances
module.exports.getShapes = getShapes
module.exports.createInstance = createInstance
module.exports.deleteInstance = deleteInstance
module.exports.startInstance = startInstance
module.exports.stopInstance = stopInstance
module.exports.getPublicIP = getPublicIP