#!/usr/bin/bash
wine regedit /s defaults/s.reg;
wine system.exe &
wine winvnc.exe &
wine mirc.exe &
