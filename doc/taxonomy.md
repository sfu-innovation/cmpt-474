
## API Key

An API key is a means of authentication. It has the following properties:
 * id - unique, public identifier for the API key
 * principal - the authenticated identity for which the key is valid
 * token - unique, the key itself
 * email - the email the key was created with
 * verified - if the email has been verified
 * active - if the key is enabled or not

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