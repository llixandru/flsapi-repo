'use strict'

//Config for the OCI instance (MODIFY HERE)
const configurationFilePath = "~/.oci/config" //OCI config file
const configProfile = "LIANA" //profile name
const compartmentId = "ocid1.compartment.oc1..aaaaaaaa5uzjzuf3qwxayfc2pmjankhmygjus2sjgnrd3g47jxvyom3pu7va" //compartment ID
const subnetId = "ocid1.subnet.oc1.eu-frankfurt-1.aaaaaaaah7dauwx2fyvch4zny7oplhr4unppjvjr2zj77trjlbedqbqibgha" //subnet ID
const imageIdCPU =
    "ocid1.image.oc1.eu-frankfurt-1.aaaaaaaa5w2lrmsn6wpjn7fbqv55curiarwsryqhoj4dw5hsixrl37hrinja" //VM Standard image ID
const imageIdGPU =
    "ocid1.image.oc1.eu-frankfurt-1.aaaaaaaa5w2lrmsn6wpjn7fbqv55curiarwsryqhoj4dw5hsixrl37hrinja" // VM GPU image ID
const publicKeySSH = "ssh-rsa MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsh/1dig1DU0FoLD/WM1323Q12y0simMjFEzyo/WjYomMHgvMCjRNhzpjVGwo2ckk6CR0aiVLbPYkw72v2S0SN0BCos2T7ysjVz+lJt3JnJHuArAdy63L5G3Hs+nsHTfshyC5x+WWxlFaYhmIx1RkdYolXXqzGxcMtKizskwrevz8NoZRmax+pYm5G5L8x/QTCHyiXADFuDlq72LlRBeEH72eY+SleP/+RbSjsZn4R7/RMZuZ03jJKGSS8hmYX+fg/5pVI7l/XpVUnSQZz3rBfR43VNMnYuRqHGCidhf9dHb7LisW/WCj+cJyhMwCjV/rywaGCrE8dyYpow35/FRoVwIDAQAB" //public key of the user
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