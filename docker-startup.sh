#!/bin/bash
nodejs /server/dist/main.js &
nginx -g "daemon off;"
