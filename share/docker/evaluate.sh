#!/bin/sh

die() {
	echo "$2" 1>&2;
	exit $1
}

# Setup the build environment
 [ -f ./build ] || die 1 "Your project doesn't appear to have a build program."
chmod +x ./build || die 1 "Unable to make build executable"
./build || die 2 "Running build failed."

 [ -f ./run ] || die 1 "Your project doesn't appear to have a run program."
chmod +x ./run || die 1 "Unable to make run executable"
./run || die 2 "Running run failed."

# We're good for now lol
exit 0