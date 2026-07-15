#!/bin/bash

# Ensure .env exists
if [ ! -f .env ]; then
  if [ -f .env.local ]; then
    cp .env.local .env
    echo "Copied .env.local to .env"
  else
    echo "Error: .env file is missing! Please create one with NEXT_PUBLIC_API_URL."
    exit 1
  fi
fi

echo "Deploying Dashboard..."
# Pull latest changes if git is used (optional, uncomment if needed)
# git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "Deployment complete! Dashboard running on port 8000."
