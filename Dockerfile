FROM nginx
MAINTAINER NozomiSugiyama <rioc.sugiyama@gmail.com>

RUN apt -y update && apt -y upgrade
RUN apt -y install openssl nodejs iproute2
RUN mkdir /server

RUN SERVER_IP=`ip a show dev eth0 | grep 'inet ' | cut -d ' ' -f 6 | cut -d '/' -f 1`\
RUN echo '\
JP\n\
Tokyo\n\
Shinjuku City\n\
firefox-screen-sharing\n\
firefox-screen-sharing\n\
$SERVER_IP\n\
rioc.sugiyama@gmail.com\n\
' | openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt

RUN openssl dhparam -out /etc/nginx/dhparam.pem 2048

RUN mkdir /etc/nginx/snippets/
RUN echo '\n\
ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;\n\
ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;\n\
' | tee /etc/nginx/snippets/self-signed.conf

RUN echo '\n\
ssl_protocols TLSv1.2;\n\
ssl_prefer_server_ciphers on;\n\
ssl_dhparam /etc/nginx/dhparam.pem;\n\
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;\n\
ssl_ecdh_curve secp384r1; # Requires nginx >= 1.1.0\n\
ssl_session_timeout  10m;\n\
ssl_session_cache shared:SSL:10m;\n\
ssl_session_tickets off; # Requires nginx >= 1.5.9\n\
ssl_stapling on; # Requires nginx >= 1.3.7\n\
ssl_stapling_verify on; # Requires nginx => 1.3.7\n\
resolver 8.8.8.8 8.8.4.4 valid=300s;\n\
resolver_timeout 5s;\n\
# Disable strict transport security for now. You can uncomment the following\n\
# line if you understand the implications.\n\
# add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";\n\
add_header X-Frame-Options DENY;\n\
add_header X-Content-Type-Options nosniff;\n\
add_header X-XSS-Protection "1; mode=block";\n\
' | tee /etc/nginx/snippets/ssl-params.conf

RUN echo '\n\
server {\n\
    listen 80 default_server;\n\
    listen [::]:80 default_server;\n\
\n\
    root /var/www/html;\n\
    index index.html index.htm index.nginx-debian.html;\n\
    server_name _;\n\
    location / {\n\
        try_files $uri $uri/ =404;\n\
    }\n\
}\n\
\n\
server {\n\
    listen 443 ssl default_server;\n\
    listen [::]:443 ssl default_server;\n\
    include snippets/self-signed.conf;\n\
    include snippets/ssl-params.conf;\n\
\n\
    root /var/www/html;\n\
    index index.html index.htm index.nginx-debian.html;\n\
    location /socket.io/ {\n\
        proxy_pass http://127.0.0.1:8080;\n\
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header Host $host;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
    }\n\
}\n\
' | tee /etc/nginx/conf.d/default.conf

COPY docker-startup.sh /docker-startup.sh
RUN chmod 744 /docker-startup.sh

EXPOSE 80 443

CMD ["/docker-startup.sh"]
