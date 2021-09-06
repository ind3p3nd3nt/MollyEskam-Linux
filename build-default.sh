#!/bin/bash
if [ -z "$1" ]
then
VARIANT=kde
else
VARIANT=$1
fi
if [ -z "$2" ]
then
ARCH=$(uname -m)
else
ARCH=$2
fi
echo "Backing up sources.list";
cp /etc/apt/sources.list /root/sources.list.bak -r;
echo "Install required components";
echo "Adding Kali Sources";
echo deb http://kali.download/kali kali-rolling main contrib non-free >/etc/apt/sources.list
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys ED444FF07D8D0BF6;
echo "Updating...";
apt update;
apt install -y live-build kali-archive-keyring curl cdebootstrap git;
cd live-build-config/;
echo "Building MollyEskam-Linux ISO Variant: $VARIANT on Architecture: $ARCH";
if [ "$ARCH" = x86_64 ]
then
./build.sh --verbose --variant $VARIANT --arch amd64;
else
./build.sh --verbose --variant $VARIANT --arch $ARCH;
fi
echo "Restoring original sources.list";
cp /root/sources.list.bak /etc/apt/sources.list -r;
echo "Worker done.";
