#!/bin/bash
# Kamis, 6 Desember 2018
# Ahmad Saepur Ramdan

adb shell "while true; do screenrecord --bit-rate=16m --output-format=h264 --size 800x600 -; done" | ffplay -framerate 60 -framedrop -bufsize 16M -
