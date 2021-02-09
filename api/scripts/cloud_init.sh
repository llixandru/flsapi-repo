#!/bin/bash
### Send stdout and stderr to /var/log/cloud-init.log
exec 1> /var/log/cloud-init2.log 2>&1
echo "========== Get argument(s) passed thru metadata"
VNC_PASSWORD=`curl -L http://169.254.169.254/opc/v1/instance/metadata | jq -j ".myarg_vnc_password"`
echo "========== Change the VNC password for user opc"
echo $VNC_PASSWORD | vncpasswd -f > /home/opc/.vnc/passwd
chmod 600 /home/opc/.vnc/passwd
echo "AllowUsers opc <USER>" > /etc/ssh/sshd_config