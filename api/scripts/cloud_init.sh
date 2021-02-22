#!/bin/bash
### Send stdout and stderr to /var/log/cloud-init2.log
exec 1> /var/log/cloud-init2.log 2>&1
echo "========== Get argument(s) passed thru metadata"
VNC_PASSWORD=`curl -L http://169.254.169.254/opc/v1/instance/metadata/myarg_vnc_password`
FSS_APPS=`curl -L http://169.254.169.254/opc/v1/instance/metadata/myarg_fss_apps`
BUCKET=`curl -L http://169.254.169.254/opc/v1/instance/metadata/myarg_bucket`
ACCESS_KEY=`curl -L http://169.254.169.254/opc/v1/instance/metadata/myarg_access_key`
SECRET_KEY=`curl -L http://169.254.169.254/opc/v1/instance/metadata/myarg_secret_key`
OS_NAMESPACE=`curl -L http://169.254.169.254/opc/v1/instance/metadata/myarg_os_namespace`
echo "========== Change the VNC password for user opc"
echo $VNC_PASSWORD | vncpasswd -f > /home/opc/.vnc/passwd
chmod 600 /home/opc/.vnc/passwd
echo "========== Change the user password for user opc"
echo $VNC_PASSWORD | passwd --stdin opc
echo "========== Fix SSH connection issue on some images"
chmod 700 /home/opc
echo "========== Mount applications shared FSS"
mount -o vers=3 $FSS_APPS /apps
echo "$FSS_APPS  /apps  nfs  defaults,noatime,_netdev  0  0" >> /etc/fstab
echo "========== Mount Object Storage"
REGION=`curl -L http://169.254.169.254/opc/v1/instance/region`
echo "$ACCESS_KEY:$SECRET_KEY" > /etc/passwd-s3fs
chmod 600 /etc/passwd-s3fs
echo "$BUCKET   /backup    fuse.s3fs    _netdev,allow_other,use_path_request_style,url=https://${OS_NAMESPACE}.compat.objectstorage.${REGION}.oraclecloud.com,endpoint=$REGION,nomultipart       0 0" >> /etc/fstab
mount /backup