FROM nginx
MAINTAINER NozomiSugiyama <rioc.sugiyama@gmail.com>

RUN apt -y update && apt -y upgrade
RUN apt -y install openssl nodejs iproute2
RUN mkdir /server

RUN SERVER_IP=`ip a show dev eth0 | grep 'inet ' | cut -d ' ' -f 6 | cut -d '/' -f 1`
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
COPY ./nginx/snippets/self-signed.conf /etc/nginx/snippets/self-signed.conf
COPY ./nginx/snippets/ssl-params.conf /etc/nginx/snippets/ssl-params.conf
RUN ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY ./docker-startup.sh /docker-startup.sh
RUN chmod 744 /docker-startup.sh

EXPOSE 80 443

CMD ["/docker-startup.sh"]
