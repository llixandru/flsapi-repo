#!/bin/bash
### Send stdout and stderr to /var/log/cloud-init2.log

exec 1> /var/log/cloud-init2.log 2>&1
echo "========== Get argument(s) passed thru metadata"
VNC_PASSWORD=`curl -L http://169.254.169.254/opc/v1/instance/metadata | jq -j ".myarg_vnc_password"`
echo "========== Change the VNC password for user opc"
echo $VNC_PASSWORD | vncpasswd -f > /home/opc/.vnc/passwd
chmod 600 /home/opc/.vnc/passwd
echo "========== Change the user password for user opc"
echo $VNC_PASSWORD | passwd --stdin opc
echo "========== Fix SSH connection issue on some images"
chmod 700 /home/opc
echo "========== Disable screen saver in graphical environment"
cat > /etc/dconf/db/local.d/00-screensaver <<
EOF
[org/gnome/desktop/screensaver]
lock-enabled=false
EOF
cat > /etc/dconf/db/local.d/locks/screensaver <<
EOF
/org/gnome/desktop/screensaver/lock-enabled
EOF
dconf update