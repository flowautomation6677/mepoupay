#!/bin/bash
set -e

# Check if swap already exists
if grep -q "swapfile" /proc/swaps; then
    echo "✅ Swap already enabled."
    exit 0
fi

echo "🔧 Setting up 2GB Swap..."
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo "✅ Swap enabled successfully!"
free -h
