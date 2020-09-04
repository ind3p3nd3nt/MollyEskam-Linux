#!/usr/bin/bash
echo 'This tool is used to mirror your android to your PC.';
sudo apt update && sudo apt install android-tools-adb ffmpeg -y;
bash -c "/sbin/mirror";