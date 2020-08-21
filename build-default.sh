#!/bin/bash
VARIANT=$1
ARCH=$2
cp /etc/apt/sources.list /root/sources.list.bak -r;
apt install gnupg -y;
echo deb http://http.kali.org/kali kali-rolling main contrib non-free >/etc/apt/sources.list
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys ED444FF07D8D0BF6;
apt update;
apt install -y live-build kali-archive-keyring curl cdebootstrap git;
cd live-build-config/;
./build.sh --verbose --variant $VARIANT --arch $ARCH;
cp /root/sources.list.bak /etc/apt/sources.list -r;
