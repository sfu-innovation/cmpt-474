# servicesd


```bash
curl -XPUT -H"Content-Type: application/json" -d'{ "type": "redis", "settings": { } }' http://localhost:4354/test
```

```bash
curl -XPUT -H"Content-Type: application/json" -d'{ "type": "python", "settings": { "source": "git+https://github.com/sfu-innovation/cmpt-474-demo-python.git" } }' http://localhost:4354/python
```

```bash
curl -XPUT -H"Content-Type: application/json" -d'{ "type": "nodejs", "settings": { "source": "git+https://github.com/sfu-innovation/cmpt-474-demo-nodejs.git" } }' http://localhost:4354/nodejs
```