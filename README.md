# firefox-screen-sharing
firefoxのみで動くWebRTCを用いた画面共有サイト

## Quick start

```bash
yarn
yarn build
cd server
yarn
yarn build
cd ..
docker build -t firefox-screen-sharing-server .
docker run -p 80:80 -p 443:443  -v `pwd`/dist:/var/www/html -v `pwd`/server:/server -d firefox-screen-sharing-server
```

## Build client

```bash
yarn
yarn build
```

## Build server
```bash
cd server
yarn
yarn build
```

## Start Docker
```bash
docker build -t firefox-screen-sharing-server .
docker run -p 80:80 -p 443:443  -v `pwd`/dist:/var/www/html -v `pwd`/server:/server -d firefox-screen-sharing-server
```
