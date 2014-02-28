#!/bin/sh

die() {
	echo "$2" 1>&2;
	exit $1
}

# Setup the build environment
 [ -f ./build ] || die 1 "Your project doesn't appear to have a build program."
chmod +x ./build || die 1 "Unable to make build executable"
./build || die 2 "Running build failed."

echo "Run complete!"

# We're good for now lol
exit 0