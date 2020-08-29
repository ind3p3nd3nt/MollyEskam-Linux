#!/usr/bin/env python
import os, sys, re

nargs = len(sys.argv)
rtext = sys.argv[1]
filename = "./live-build-config/auto/config"
with open(filename, 'r+') as f:

    text = f.read()

    text = re.sub('http://archive.kali.org/kali', rtext, text)

    f.seek(0)

    f.write(text)

    f.truncate()