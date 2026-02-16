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

# 3. Determine Environment File
ENV_FILE=""
if [ -f "prod.env" ]; then
    ENV_FILE="prod.env"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
else
    echo "❌ Error: No environment file found (checked prod.env and .env)!"
    exit 1
fi
echo "✅ Using environment file: $ENV_FILE"

# 4. Execute Docker Compose
# We use COMPOSE_FILE environment variable to force merging order if command line args fail
echo "🐳 Building and Starting Containers..."
export COMPOSE_FILE=docker-compose.base.yml:docker-compose.prod.yml
sudo -E docker compose --env-file "$ENV_FILE" up -d --build --remove-orphans

echo "✅ Deployment Complete!"
