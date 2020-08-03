#!/bin/bash
xfce4-terminal -e "apt update";
xfce4-terminal -e "apt full-upgrade -y";
xfce4-terminal -e "apt install kali-linux-everything -y";
xfce4-terminal -e "git clone https://github.com/independentcod/mollyweb";
xfce4-terminal -e "sh mollyweb/bootstrap.sh";
exit 0
