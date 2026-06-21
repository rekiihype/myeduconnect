FROM nginx:alpine
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/server.key \
      -out /etc/nginx/ssl/server.crt \
      -subj "/C=MY/ST=KL/O=MyEduConnect/CN=localhost"
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY frontend /usr/share/nginx/html
