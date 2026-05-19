FROM node:22.22.2-trixie-slim AS build

WORKDIR /app
RUN npm i -g postject
COPY package*.json ./
RUN npm ci

# Creating a single executable application for import-meta-env
RUN echo '{ "main": "node_modules/@import-meta-env/cli/bin/import-meta-env.js", "output": "sea-prep.blob" }' > sea-config.json
RUN node --experimental-sea-config sea-config.json
RUN cp $(command -v node) import-meta-env
RUN npx postject import-meta-env NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

COPY . ./
RUN npm run build

# Prune dev dependencies to keep build stage output clean
RUN npm prune --omit=dev

FROM nginx:1.29.8-trixie

ARG VITE_VERSION
ENV VITE_VERSION=${VITE_VERSION}

# Optional environment variables are set to empty string in the container, such that import-meta-env does not complain when they are not set

ENV VITE_VPN_CONTAINER_DEVICE_TYPE=""
ENV VITE_EDGE_GATEWAY_WITH_VPN_CONTAINER_DEVICE_TYPE=""

COPY .env.example /app/
COPY inject-env.sh /docker-entrypoint.d/5-inject-env.sh

# Fix line endings and make executable (handles Windows CRLF issue)
RUN dos2unix /docker-entrypoint.d/5-inject-env.sh 2>/dev/null || sed -i 's/\r$//' /docker-entrypoint.d/5-inject-env.sh && \
    chmod +x /docker-entrypoint.d/5-inject-env.sh

# Copy single page application bundle and import-meta-env binary
COPY --from=build --chown=nginx:nginx /app/build /usr/share/nginx/html
COPY --from=build --chown=nginx:nginx /app/import-meta-env /app/

# Copy nginx configuration
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

# Assign necessary permissions to nginx user
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run /var/lib/nginx \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run /var/lib/nginx
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Run as non-root user 
USER nginx