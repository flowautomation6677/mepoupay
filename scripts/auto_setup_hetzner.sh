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
# Prevent interactive prompts
export DEBIAN_FRONTEND=noninteractive
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
echo -e "${BLUE}📝 Configuring .env file...${NC}"
# Using quoted EOF to prevent variable expansion, ensuring exact values are written
cat > "$PROJECT_DIR/.env" <<'EOF'
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=https://okvizpzxcdxltqjmjruo.supabase.co
SUPABASE_KEY=your_supabase_key
SUPABASE_ANON_KEY=your_supabase_anon_key
REDIS_URL=redis://redis:6379
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=your_evolution_api_key
SERVER_PORT=4000
EVOLUTION_INSTANCE_NAME=FinanceBot
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key 
SONAR_TOKEN=
POSTGRES_PASSWORD=postgres
POSTGRES_URL=postgresql://postgres:postgres@postgres:5432/finance
INTERNAL_WEBHOOK_URL=http://finance-bot:4000/webhook/evolution
WEBHOOK_PUBLIC_URL=http://5.161.89.46:4000
EOF

echo -e "${GREEN}✅ .env file created with production values!${NC}"

# 5. Run Deployment
echo -e "${BLUE}🚀 Launching Deployment...${NC}"
chmod +x deploy.sh
./deploy.sh

echo -e "${GREEN}✨ Server Setup Complete! Your application should be running soon.${NC}"
echo -e "Check status with: ${BLUE}docker compose ps${NC}"
