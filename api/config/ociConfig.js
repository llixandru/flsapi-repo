'use strict'

//Config for the OCI instance (MODIFY HERE)
const configurationFilePath = "~/.oci/config" //OCI config file
const configFileForFsWrite = "../../../../.oci/config"
const configProfile = "LIANA" //profile name
const compartmentId = "ocid1.compartment.oc1..aaaaaaaa5uzjzuf3qwxayfc2pmjankhmygjus2sjgnrd3g47jxvyom3pu7va" //compartment ID
const tenancyId = "ocid1.tenancy.oc1..aaaaaaaagwmwhlofsz3rx4d3glfaqxlim4ryintboyuashvnw32e3uqx4wia" //tenancy ID
const publicKeySSH = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCte1+ZwUzx36hMRpFWYs0a3MO5bkEnWxFA+UTwMoaD4rzbo2gX6LlnhMVWwsj6Obgx3m6nIror7LPdk4R/es+bgswFoSQJSJVmJu8+tneZ9EYySUBQ8ndsUDqOEo1Gav3EIkk5toNsRzRt8Ej7iuZJJNmHfEVJ2ADYIbC5xPo7DNW3vPz1UIreVqAk098Ma1LjcIf9HkJmLKGtWmEhGwsNZ4512eTudA8L2N998+/7gqXc3Z127U3pTSdt9cs7gxp4PIDrqC6uPIIg74dVSeoI4/vy8TDUrOTMgZbGGgN8KeL5rw7/nBSZtD9fZ6nnwaFta12Mrx0UyB0MeibcgZMF testoci" //public key of the user
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
exports.publicKeySSH = publicKeySSH
exports.scriptPath = scriptPath
exports.accessKey = accessKey
exports.secretKey = secretKey
exports.bucketName = bucketName
exports.tenancyId = tenancyId
exports.configFileForFsWrite = configFileForFsWrite