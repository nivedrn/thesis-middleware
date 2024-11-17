FROM node:21

RUN apt-get update && apt-get install -y nginx redis-server

COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

COPY ./server /server
WORKDIR /server

RUN npm install

EXPOSE 80 

CMD service nginx start && service redis-server start && node server.js  