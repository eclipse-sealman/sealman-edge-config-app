#!/bin/sh
set -eu

# Inject environment variables to single page application bundle
/app/import-meta-env \
	-x /app/.env.example \
	--path /usr/share/nginx/html/index.html \
	--disposable