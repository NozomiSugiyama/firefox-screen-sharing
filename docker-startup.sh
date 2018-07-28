#!/bin/bash
nodejs /server/dist/index.js &
nginx -g "daemon off;"
