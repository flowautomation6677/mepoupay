#!/bin/bash

# Stop execution on error
set -e

echo "🚀 Starting Deployment Script..."

# 1. Pull latest changes
echo "📥 Pulling latest code..."
git pull

# 2. Check for required files
if [ ! -f "docker-compose.base.yml" ]; then
    echo "❌ Error: docker-compose.base.yml not found!"
    exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Error: docker-compose.prod.yml not found!"
    exit 1
fi

# 3. Execute Docker Compose
# We use COMPOSE_FILE environment variable to force merging order if command line args fail
echo "🐳 Building and Starting Containers..."
export COMPOSE_FILE=docker-compose.base.yml:docker-compose.prod.yml
sudo -E docker compose up -d --build --remove-orphans

echo "✅ Deployment Complete!"
