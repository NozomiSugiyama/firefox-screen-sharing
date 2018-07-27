# firefox-screen-sharing
firefoxのみで動くWebRTCを用いた画面共有サイト

## How to start

```bash
yarn
cd server
yarn
cd ..
docker build -t firefox-screen-sharing-server .
docker run -p 80:80 -p 443:443  -v `pwd`/dist:/var/www/html -v `pwd`/server:/server -d firefox-screen-sharing-server
```
