#!/bin/sh

# Mark as production environment
export NODE_ENV="production" 

pm2 reload www worker-run worker-evaluation

# Start the HTTP front-end on 80 for now
PORT=80 pm2 start -n www -i max server.js

# Start the job workers
pm2 start -x -n worker-run -i 2 ./lib/workers/run.js
pm2 start -x -n worker-evaluation -i 2 ./lib/workers/evaluation.js
