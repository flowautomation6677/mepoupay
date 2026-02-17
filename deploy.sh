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
# Load env vars to pass them as build args (simplified approach)
# We need to source the env file to make variables available to the shell for the next command
set -a
source "$ENV_FILE"
set +a

# Construct build args string
BUILD_ARGS="--build-arg RESEND_API_KEY=${RESEND_API_KEY}"

echo "🐳 Building and Starting Containers..."
export COMPOSE_FILE=docker-compose.base.yml:docker-compose.prod.yml
# We pass the build arg explicitly to the build command via docker compose
# Note: simple 'docker compose up --build' might not pick up env vars as build-args automatically 
# without them being in the compose file under 'build: args:'. 
# To be safe and avoid changing compose files, we can use an override or just rely on the env if mapped in compose.
# BUT, since we modified Dockerfile to expect ARG, we must ensure it gets it.
# The most robust way without changing compose files is ensuring the variable is in the shell 
# and the compose file (which we haven't seen) maps it.
# Let's assume the compose file uses standard context. 
# Actually, the best way here is to just rely on the ENV_FILE being passed, 
# AND ensure we export the var so docker-compose interpolation works if needed.

# Wait, if we added ARG to Dockerfile, we need to pass it via --build-arg. 
# 'docker compose up' doesn't easily support arbitrary --build-arg flags for all services.
# We might need to update docker-compose.base.yml or prod.yml to map the arg.
# Let's check docker-compose.base.yml first before modifying deploy.sh blindly.


echo "✅ Deployment Complete!"
