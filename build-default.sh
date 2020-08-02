#!/bin/bash
VARIANT=default
cp /etc/apt/sources.list /root/sources.list.bak -r;
apt install gnupg -y;
echo deb http://http.kali.org/kali kali-rolling main contrib non-free >/etc/apt/sources.list
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ED444FF07D8D0BF6;
apt update;
apt install -y live-build kali-archive-keyring curl cdebootstrap git;
cd live-build-config/;
./build.sh --verbose --variant $VARIANT;
cp /root/sources.list.bak /etc/apt/sources.list -r;
