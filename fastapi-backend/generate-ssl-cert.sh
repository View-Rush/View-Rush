#!/bin/bash

# Script to generate self-signed SSL certificate for development/testing
# Run this before starting docker-compose if you don't have a domain

echo "Generating self-signed SSL certificate..."

# Create SSL directory if it doesn't exist
mkdir -p nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "✅ Self-signed certificate generated successfully!"
echo "Certificate: nginx/ssl/cert.pem"
echo "Key: nginx/ssl/key.pem"
echo ""
echo "⚠️  WARNING: This is a self-signed certificate for development only."
echo "For production, use Let's Encrypt with the setup-letsencrypt.sh script."
