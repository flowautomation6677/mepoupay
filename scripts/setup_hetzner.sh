#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Me Poupay Server Setup for Hetzner...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

# 1. Update System
echo -e "${BLUE}🔄 Updating system packages...${NC}"
apt update && apt upgrade -y
apt install -y curl git unzip

# 2. Install Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed successfully!${NC}"
else
    echo -e "${GREEN}✅ Docker is already installed.${NC}"
fi

# 3. Setup Project Directory
PROJECT_DIR="/opt/mepoupay"
REPO_URL="https://github.com/flowautomation6677/mepoupay.git"

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${BLUE}📂 Project directory exists. Pulling latest changes...${NC}"
    cd "$PROJECT_DIR"
    git pull
else
    echo -e "${BLUE}📂 Cloning repository to $PROJECT_DIR...${NC}"
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 4. Setup Environment Variables
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${BLUE}📝 Configuring .env file...${NC}"
    echo -e "${RED}⚠️  IMPORTANT: Please paste your .env content below (Press Ctrl+D when finished):${NC}"
    cat > "$ENV_FILE"
    echo -e "${GREEN}✅ .env file created!${NC}"
else
    echo -e "${BLUE}ℹ️  .env file already exists. Skipping creation.${NC}"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}⚠️  Paste new content (Press Ctrl+D when finished):${NC}"
        cat > "$ENV_FILE"
    fi
fi

# 5. Run Deployment
echo -e "${BLUE}🚀 Launching Deployment...${NC}"
chmod +x deploy.sh
./deploy.sh

echo -e "${GREEN}✨ Server Setup Complete! Your application should be running soon.${NC}"
echo -e "Check status with: ${BLUE}docker compose ps${NC}"
