# Cloud
> Learn about clouds n' stuff.

This repository contains the infrastructure for CMPT-474 at SFU. Enter at your own risk.

## Getting Started

Cloud requires the following software:
 * node.js
 * Redis

However, certain features will only be available if you
have additional software installed:
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
sudo apt-get install nodejs redis-server lxc
```

#### Mac OS X
```bash
# Install brew if you don't have it already.
ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"
# Install node.js and redis.
brew install node redis
```

#### Windows
- Install node.js from here: http://nodejs.org/download/.
- Install redis from here: https://github.com/rgl/redis/downloads.

### Installation
After you have installed node.js and Redis you can get started with
the actual software.

```bash
# Get the source code.
git clone https://github.com/sfu-innovation/cmpt-474.git cloud
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
There is a configuration file that controls the majority of the settings
run by the stack.

```json
{

}
```

#### E-Mail Verification
If you wish to include email verification in your stack you can sign 
up for a basic free account at [MailDrill](https://mandrillapp.com/).


## Documentation
Complete documentation can be found in the [/docs](./docs) folder
in the repository. 

## Development

If you're hacking the source code, looking for more documentation
or just want to make sure things are running as intended you can
get started with the built-in Mocha test suite found in /test.


```bash
# Make sure development dependencies are installed
npm install --dev
# Run the test suite
npm test
```

## Service

A service is a description of a program which can be run on
an instance that (typically) provides and exposes to the user
some kind of useful functionality.

All services are described by a type.

The supported services in Cloud are:

### Redis
```json
{ "type": "redis", "settings": {
	
}}
```

### Python
```json
{ "type": "python", "settings": {
	
}}
```

### Node
```json
{ "type": "nodejs", "settings": {
	
}}
```

## Instance
An instance is the entity within which one or more
services are running. Instances typically have
their own levels of resource allocation and networking
setup.

## Topology
A topology is a description of several instances.

## Benchmark
A benchmark is a description of a set of tests to run
against a topology.

# API
A [RESTful API](./docs/api.md) is available for you 
to use over HTTPS in order to do things like spin up 
new instances, update services and run benchmarks.

This API can be used directly via the command line with
[curl](http://curl.haxx.se/), within [Python](http://www.python.org/), 
or by any system which is able to send and receive 
HTTP requests and responses with JSON bodies.

Most functionality requires an API key to use. When this
API key is required, it is provided in the X-API-Key header
field. Each key is rate-limited to 1000 requests every 5 
minutes or so in a feeble attempt to prevent abuse. 
Information about key usage is provided in the response header
for every request.

## Getting an API Key

```bash
export ENDPOINT="https://innovate.cs.surrey.sfu.ca/cloud"
curl -d'{ "email": "test@sfu.ca" } -XPOST "${ENDPOINT}/api-key"
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
