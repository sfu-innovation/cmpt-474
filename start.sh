#!/bin/sh

# Mark as production environment
export NODE_ENV="production" 

# Start the HTTP front-end
pm2 start -i max server.js

# Start the job workers
pm2 start -x -i 2 ./lib/workers/run.js
pm2 start -x -i 2 ./lib/workers/evaluation.js
