#!/bin/bash
PID=$(pgrep xfce4-session)
export DBUS_SESSION_BUS_ADDRESS=$(grep -z DBUS_SESSION_BUS_ADDRESS /proc/$PID/environ|cut -d= -f2-)

python "$(dirname -- "$0")"/change_bg_image.py
