'use strict'

//Config for the OCI instance (MODIFY HERE)
const configurationFilePath = "~/.oci/config" //OCI config file
const configFileForFsWrite = "../../../../.oci/config"
const configProfile = "LIANA" //profile name
const compartmentId = "ocid1.compartment.oc1..aaaaaaaa5uzjzuf3qwxayfc2pmjankhmygjus2sjgnrd3g47jxvyom3pu7va" //compartment ID
const tenancyId = "ocid1.tenancy.oc1..aaaaaaaagwmwhlofsz3rx4d3glfaqxlim4ryintboyuashvnw32e3uqx4wia" //tenancy ID
const subnetId = "ocid1.subnet.oc1.eu-frankfurt-1.aaaaaaaah7dauwx2fyvch4zny7oplhr4unppjvjr2zj77trjlbedqbqibgha" //subnet ID
const imageIdCPU =
    "ocid1.image.oc1.eu-frankfurt-1.aaaaaaaa5w2lrmsn6wpjn7fbqv55curiarwsryqhoj4dw5hsixrl37hrinja" //VM Standard image ID
const imageIdGPU =
    "ocid1.image.oc1.eu-frankfurt-1.aaaaaaaa5w2lrmsn6wpjn7fbqv55curiarwsryqhoj4dw5hsixrl37hrinja" // VM GPU image ID
const publicKeySSH = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCte1+ZwUzx36hMRpFWYs0a3MO5bkEnWxFA+UTwMoaD4rzbo2gX6LlnhMVWwsj6Obgx3m6nIror7LPdk4R/es+bgswFoSQJSJVmJu8+tneZ9EYySUBQ8ndsUDqOEo1Gav3EIkk5toNsRzRt8Ej7iuZJJNmHfEVJ2ADYIbC5xPo7DNW3vPz1UIreVqAk098Ma1LjcIf9HkJmLKGtWmEhGwsNZ4512eTudA8L2N998+/7gqXc3Z127U3pTSdt9cs7gxp4PIDrqC6uPIIg74dVSeoI4/vy8TDUrOTMgZbGGgN8KeL5rw7/nBSZtD9fZ6nnwaFta12Mrx0UyB0MeibcgZMF testoci" //public key of the user
const AD = 0 //Availability domain, choose between 0,1 and 2
const appsFss = "10.0.0.6:/fls-app-fss"
const accessKey = "xxx"
const secretKey = "xxx"
const bucketName = "xxxx"
    //End Config for the OCI instance

//Cloud init script
const scriptPath = "./api/scripts/cloud_init.sh"

//Exports
exports.configurationFilePath = configurationFilePath
exports.configProfile = configProfile
exports.compartmentId = compartmentId
exports.subnetId = subnetId
exports.imageIdCPU = imageIdCPU
exports.imageIdGPU = imageIdGPU
exports.publicKeySSH = publicKeySSH
exports.scriptPath = scriptPath
exports.AD = AD
exports.appsFss = appsFss
exports.accessKey = accessKey
exports.secretKey = secretKey
exports.bucketName = bucketName
exports.tenancyId = tenancyId
exports.configFileForFsWrite = configFileForFsWrite