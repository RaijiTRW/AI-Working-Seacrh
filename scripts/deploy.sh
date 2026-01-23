#!/bin/bash
# Production Deploy Script for Windows Git Bash
# This script is called by GitHub Actions via SSH

set -e  # Exit on any error

APP_DIR="/c/apps/AI-Working-Seacrh"
LOGS_DIR="$APP_DIR/logs"

echo "=========================================="
echo "  AI Working Search - Production Deploy"
echo "=========================================="
echo ""

cd "$APP_DIR"

# Create logs directory if not exists
mkdir -p "$LOGS_DIR"

# Save old version
echo ">>> Saving current version..."
cat .version > .version-old 2>/dev/null || echo "unknown" > .version-old
OLD_VERSION=$(cat .version-old)
echo "    Old version: $OLD_VERSION"

# Pull latest code
echo ""
echo ">>> Pulling latest code from GitHub..."
git fetch origin main
git reset --hard origin/main
git rev-parse --short HEAD > .version
NEW_VERSION=$(cat .version)
echo "    New version: $NEW_VERSION"

if [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
    echo ""
    echo ">>> No changes detected. Skipping build."
    echo "=========================================="
    exit 0
fi

# Install dependencies
echo ""
echo ">>> Installing frontend dependencies..."
npm ci --prefer-offline --no-audit

# Build Next.js (this is the critical part - must complete before PM2 reload)
echo ""
echo ">>> Building Next.js (this may take a while)..."
echo "    Cleaning old build..."
rm -rf .next

echo "    Running build..."
npm run build

# Verify build succeeded
if [ ! -d ".next" ]; then
    echo "!!! ERROR: Build failed - .next directory not found"
    exit 1
fi

if [ ! -f ".next/BUILD_ID" ]; then
    echo "!!! ERROR: Build incomplete - BUILD_ID not found"
    exit 1
fi

BUILD_ID=$(cat .next/BUILD_ID)
echo "    Build complete! BUILD_ID: $BUILD_ID"

# Now reload PM2 (zero-downtime)
echo ""
echo ">>> Reloading PM2 services..."

# Check if PM2 processes exist
if pm2 list 2>/dev/null | grep -q "jobai-frontend"; then
    echo "    Reloading existing processes..."
    pm2 reload jobai-frontend --update-env
else
    echo "    Starting PM2 for the first time..."
    pm2 start ecosystem.config.js
    pm2 save
fi

# Wait for services to start
echo ""
echo ">>> Waiting for services to start..."
sleep 5

# Health checks
echo ""
echo ">>> Running health checks..."

FRONTEND_OK=false

for i in 1 2 3 4 5; do
    echo "    Attempt $i/5..."

    if curl -s -f http://127.0.0.1:3000/api/version > /dev/null 2>&1; then
        FRONTEND_OK=true
        echo "    ✓ Frontend OK"
        break
    fi

    sleep 2
done

echo ""
echo ">>> PM2 Status:"
pm2 status

echo ""
echo "=========================================="
if [ "$FRONTEND_OK" = true ]; then
    echo "  ✓ DEPLOYMENT SUCCESSFUL"
    echo "  Old: $OLD_VERSION → New: $NEW_VERSION"
else
    echo "  ⚠ DEPLOYMENT COMPLETED WITH WARNINGS"
    echo "  ✗ Frontend not responding"
fi
echo "=========================================="
