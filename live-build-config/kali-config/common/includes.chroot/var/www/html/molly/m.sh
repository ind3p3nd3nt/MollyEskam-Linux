#!/bin/bash
FILES=*.jp*g
for f in $FILES
do
  echo "<img src=molly/$f>"
done
