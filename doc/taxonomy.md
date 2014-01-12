
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