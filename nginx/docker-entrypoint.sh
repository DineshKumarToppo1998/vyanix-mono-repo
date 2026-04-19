#!/bin/sh
set -e

CERT_DIR=/etc/nginx/certs

# Generate a self-signed cert if none exists.
# On a real server, replace these files with Let's Encrypt certs and restart nginx.
if [ ! -f "$CERT_DIR/cert.pem" ] || [ ! -f "$CERT_DIR/key.pem" ]; then
    echo "[nginx-entrypoint] No TLS cert found — generating self-signed cert..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -newkey rsa:4096 \
        -keyout "$CERT_DIR/key.pem" \
        -out "$CERT_DIR/cert.pem" \
        -days 365 -nodes \
        -subj "/CN=${SERVER_NAME:-localhost}"
    echo "[nginx-entrypoint] Self-signed cert generated for CN=${SERVER_NAME:-localhost}"
fi

exec "$@"
