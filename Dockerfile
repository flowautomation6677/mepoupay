FROM node:18-slim

# Install system dependencies required for Puppeteer/Canvas interactions if needed, 
# but mostly just ffmpeg for media processing now.
RUN apt-get update \
    && apt-get install -y wget gnupg ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

RUN npm ci --omit=dev

# Copy app source
COPY . .

# Run the bot
CMD [ "npm", "start" ]
