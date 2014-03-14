#!/bin/sh -e


# Setup the build environment
[ -f ./build ] || die 1 "Your project doesn't appear to have a build program."
chmod +x ./build || die 1 "Unable to make build executable"
./build

[ -f ./run ] || die 1 "Your project doesn't appear to have a run program."
chmod +x ./run || die 1 "Unable to make run executable"
./run 

