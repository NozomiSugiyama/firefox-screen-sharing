#!/bin/bash
nodejs /server/index.js &
nginx -g "daemon off;"
