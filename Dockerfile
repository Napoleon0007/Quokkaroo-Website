# Quokkaroo — static site served by Caddy (binds Railway's $PORT)
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY . /srv
