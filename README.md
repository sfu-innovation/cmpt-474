# Cloud

[![Build Status](https://travis-ci.org/sfu-innovation/cmpt-474.png?branch=master)](https://travis-ci.org/sfu-innovation/cmpt-474)

> Learn about clouds n' stuff.

This repository contains the infrastructure for CMPT-474 at SFU. Enter at your own risk.

## Getting Started

Cloud requires the following software:
 * node.js
 * Redis

However, certain features will only be available if you have additional software installed:
 * LXC
 * Git

### Platform-Specific Instructions
#### Ubuntu
On some versions of Ubuntu nodejs isn't up-to-date:
```bash
# Install python-software-properties for add-apt-repository.
sudo apt-get install python-software-properties
# Add the node.js PPA for the latest version of node.js.
sudo add-apt-repository ppa:chris-lea/node.js
# Update all the software sources.
sudo apt-get update 
# Install the stuff we need.
sudo apt-get install nodejs redis-server lxc git
```

#### Mac OS X
```bash
# Install brew if you don't have it already.
ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"
# Install node.js and redis.
brew install node redis git
```

#### Windows
- Install node.js from here: http://nodejs.org/download/.
- Install redis from here: https://github.com/rgl/redis/downloads.
- Install git from here: https://code.google.com/p/msysgit/downloads/.

### Installation
After you have installed node.js and Redis you can get started with the actual software.

Either download the code as a zip file from https://github.com/sfu-innovation/cmpt-474/archive/master.zip and extract it to a folder called "cloud" or use git:

```bash
# Get the source code.
git clone https://github.com/sfu-innovation/cmpt-474.git cloud
```

Then proceed:

```bash
cd cloud
# Setup some configuration values.
cp config.example.json config.json
subl config.json
# Install package dependencies.
npm install --production
# Run the service.
npm start
```


### Configuration
There is a configuration file that controls the majority of the settings run by the stack.

```json
{
	"setting": "value"
}
```

#### Listen Addresses
=======

Control which addresses and ports are listened on by specifying a listen directive. Listen can be either an array of listen directives or a single directive. A directive can be either the boolean value true to assume all defaults, an integer value specifying the port with the rest of the values as defaults, a string value specifying the address with the rest of the values as defaults, or an object containing keys for all the properties.

**Remember: Some operating systems (Linux, Mac OS X) require elevated privileges to listen on ports below 1024.**

```json
{
	"listen": true
}
```

```json
{
	"listen": [ 80, 443 ]
}
```

```json
{
	"listen": { "port": 80, "address": "127.0.0.1", "protocol": "http" }
}
```

#### Logging

Control how information is logged. 

```json
{
	"logging": {
		"level": "info",
		"transports": [ 
			{ "type": "console", "settings": { "colorize": true }},
			{ "type": "file", "settings": { "filename": "./var/log/server.log" }}
		]
	}
}
```

#### Activation

If you wish to include account verification in your stack. 

You can sign up for a basic free account at [MailDrill](https://mandrillapp.com/).

```json
{
	"activation": {

	}
}
```

#### Rate-Limiting

```json
{
	"rateLimit": { 
		"path": "/",
		"limit": 5000,
		"interval": 3600
	}
}
```

#### Platforms
A priority-sorted list of platforms to use to create instances. The first platform that works will be selected for use. If a platform "enable" attribute is set to false, the platform will be ignored during the election process.

```json
{
	"platforms": [
		{ "type": "lxc", "enabled": true, "settings": { } },
		{ "type": "native", "enabled": true, "settings": { } }
	]
}
```

## Documentation
Complete documentation can be found in the [/doc](./doc) folder in the repository. 

## Development

If you're hacking the source code, looking for more documentation or just want to make sure things are running as intended you can get started with the built-in Mocha test suite found in [/test](./test).


```bash
# Make sure development dependencies are installed
npm install --dev
# Run the test suite
npm test
```

# API
A [RESTful API](./doc/api.md) is available for you to use over HTTPS in order to do things like spin up new instances, update services and run benchmarks.

This API can be used directly via the command line with [curl](http://curl.haxx.se/), within [Python](http://www.python.org/), or by any system which is able to send and receive HTTP requests and responses with JSON bodies.

Most functionality requires an API key to use. When this API key is required, it is provided in the X-API-Key header field. Each key is rate-limited to 1000 requests every 5 minutes or so in a feeble attempt to prevent abuse. Information about key usage is provided in the response header for every request.

## Getting an API Key

```bash
export ENDPOINT="https://innovate.cs.surrey.sfu.ca/cloud"
curl -d'{ "email": "test@sfu.ca" }' -XPOST "${ENDPOINT}/api-key"
```

```bash
cloud-control create-key --email "test@sfu.ca"
```

```python
import cloud
api = cloud.create("https://innovate.cs.surrey.sfu.ca/cloud")
api.createKey(email="test@sfu.ca")
```

## Example Usage

```bash
export ENDPOINT="https://innovate.cs.surrey.sfu.ca/cloud"
export API_KEY="8a324ae07a..."
curl -i \
	-H"X-API-Key: ${API_KEY}" \
	-H"Content-type: application/json" \
	-d'{"test": true}' \
	-XGET "${ENDPOINT}/"
```

```bash
cloud-control --api-key "8a324ae07a..." info
```

```python
import cloud
api = cloud.create("https://localhost", "8a324ae07a...")
print(api.version)
```
