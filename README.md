
## Molly Eskam Linux Operating System / Webserver
### updated Jul 13th 2021

#####  This is a custom live kali iso build with KDE Plasma Desktop Evironment which has the following features & programs:
#####  VLC Media Player, Bittorrent Downloader (Deluge), Webserver (Apache2 with SSL), Security tools (from kali-linux-nethunter), File Cleaner (Bleachbit), [Browsers]: FireFox, Chromium, [Image Editor] G.I.M.P2 , LibreOffice, firewall-applet, X11VNC Server and OpenVPN.
#### (Which is perfect for people who just wants to learn about Linux Operating System.)

## Download Links:
### https://archive.org/details/molly-eskam-linux

#####  DEFAULT LOGIN
#####  User: root
#####  Password: toor

#####  Secondary admin LOGIN
#####  User: molly
#####  Password: eskam123

## DO NOT FORGET TO CHANGE YOUR PASSWORD!!!
### type (In a terminal window):
#### passwd root
### (Also consider making an installation instead of using the live build, because it might be buggy)


# Installation instructions
#####  1. Download this program: https://www.balena.io/etcher/
#####  2. Download MollyEskam-Linux flavor of your choice.
#####  3. Use the program to flash it into an USB Drive (4GB minimum)
#####  4. Boot the target computer with the USB Drive in and PRESS F12 until you see a boot menu option
#####  5. Use the arrows to navigate and select the correct drive.
#####  PLEASE NOTE: You will need to disable secure boot and enable booting from USB. 


# BUILD THE ISO YOURSELF
### Enter these commands in the termnial:
#### git clone https://github.com/ind3p3nd3nt/MollyEskam-Linux && sh MollyEskam-Linux/build-default.sh [ variant [ arch] ]
##### PLEASE NOTE build will take several hours to complete depending on your CPU power, memory limit and internet speed
