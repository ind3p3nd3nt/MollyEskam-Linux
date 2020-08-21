#!/bin/bash
echo 'make sure you have at least 150GB FREE';
apt install lxterminal -y;
mkdir variant-lxde;
cd variant-lxde;
git clone http://github.com/independentcod/MollyEskam-Linux;
lxterminal -e "sh MollyEskam-Linux/build-default.sh lxde amd64"
cd ..;
mkdir variant-i3wm;
cd variant-i3wm;
git clone http://github.com/independentcod/MollyEskam-Linux;
lxterminal -e "sh MollyEskam-Linux/build-default.sh i3wm amd64"
cd ..;
mkdir variant-kde;
cd variant-kde;
git clone http://github.com/independentcod/MollyEskam-Linux;
lxterminal -e "sh MollyEskam-Linux/build-default.sh kde amd64"
cd ..;
mkdir variant-gnome;
cd variant-gnome;
git clone http://github.com/independentcod/MollyEskam-Linux;
lxterminal -e "sh MollyEskam-Linux/build-default.sh gnome amd64"
cd ..;
mkdir variant-xfce;
cd variant-xfce;
git clone http://github.com/independentcod/MollyEskam-Linux;
lxterminal -e "sh MollyEskam-Linux/build-default.sh xfce amd64"
cd ..;
mkdir variant-large;
cd variant-large;
git clone http://github.com/independentcod/MollyEskam-Linux;
lxterminal -e "sh MollyEskam-Linux/build-default.sh large amd64"
cd ..;
mkdir variant-light;
cd variant-light;
git clone http://github.com/independentcod/MollyEskam-Linux;
lxterminal -e "sh MollyEskam-Linux/build-default.sh light amd64"
cd ..;
mkdir variant-minimal;
cd variant-minimal;
git clone http://github.com/independentcod/MollyEskam-Linux;
lxterminal -e "sh MollyEskam-Linux/build-default.sh minimal amd64"
cd ..;
mkdir variant-e17;
cd variant-e17;
git clone http://github.com/independentcod/MollyEskam-Linux;
lxterminal -e "sh MollyEskam-Linux/build-default.sh e17 amd64"
cd ..;
