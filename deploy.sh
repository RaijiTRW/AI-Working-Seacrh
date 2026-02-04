#!/bin/bash
# Zero-downtime deployment script for JobAI Search

set -e

# ═══════════════════════════════════════════════════════════════
# ⚙️  CONFIGURATION - ИЗМЕНИТЕ ЭТИ ЗНАЧЕНИЯ!
# ═══════════════════════════════════════════════════════════════
APP_DIR="/home/your-user/jobaisearch-frontend"  # <-- ПУТЬ К ВАШЕМУ ПРОЕКТУ
USER="your-user"                                # <-- ВАШ ПОЛЬЗОВАТЕЛЬ
PORT_OLD=3000
PORT_NEW=3001
HEALTH_CHECK_URL="http://localhost:${PORT_NEW}/api/version"
MAX_RETRIES=30
RETRY_DELAY=2
# ═══════════════════════════════════════════════════════════════

echo "🚀 Starting zero-downtime deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest changes..."
cd "$APP_DIR"
git fetch origin
git reset --hard origin/main  # Hard reset for clean deploy

# 2. Save current git commit for version tracking
echo "💾 Saving git commit..."
GIT_COMMIT=$(git rev-parse --short HEAD)
echo "$GIT_COMMIT" > .version

# 3. Install dependencies
echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit --no-fund

# 4. Build the application
echo "🔨 Building Next.js application..."
NODE_ENV=production npm run build

# 5. Start new instance on different port
echo "🔄 Starting new instance on port ${PORT_NEW}..."
cd "$APP_DIR"
PORT=$PORT_NEW NODE_ENV=production nohup npm start > logs/new-instance.log 2>&1 &
NEW_PID=$!
echo "New PID: $NEW_PID"

# 6. Health check - wait for new instance to be ready
echo "⏳ Waiting for new instance to be healthy..."
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
        NEW_VERSION=$(curl -s "$HEALTH_CHECK_URL" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        echo "✅ New instance is healthy! Version: $NEW_VERSION"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Attempt $RETRY_COUNT/$MAX_RETRIES - waiting..."
    sleep $RETRY_DELAY
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ New instance failed to start. Check logs at $APP_DIR/logs/new-instance.log"
    kill $NEW_PID 2>/dev/null || true
    exit 1
fi

# 7. Update Caddy to point to new port
echo "🔄 Updating Caddy configuration..."
sed -i "s/localhost:${PORT_OLD}/localhost:${PORT_NEW}/g" /etc/caddy/Caddyfile
caddy reload --config /etc/caddy/Caddyfile

# 8. Gracefully shutdown old instance
echo "🛑 Shutting down old instance on port ${PORT_OLD}..."
sleep 3  # Give time for Caddy to switch

OLD_PIDS=$(lsof -ti:${PORT_OLD} 2>/dev/null || true)
if [ -n "$OLD_PIDS" ]; then
    echo "Sending SIGTERM to old instances: $OLD_PIDS"
    kill -TERM $OLD_PIDS 2>/dev/null || true

    # Wait for graceful shutdown or force kill after 30 seconds
    for i in {1..30}; do
        if ! lsof -ti:${PORT_OLD} > /dev/null 2>&1; then
            echo "✅ Old instance shut down gracefully"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "⚠️ Force killing old instance..."
            kill -9 $OLD_PIDS 2>/dev/null || true
        fi
        sleep 1
    done
else
    echo "No old instance found on port ${PORT_OLD}"
fi

# 9. Update port for next deployment (swap ports back)
echo "🔄 Swapping ports for next deployment..."
sed -i "s/localhost:${PORT_NEW}/localhost:${PORT_OLD}/g" /etc/caddy/Caddyfile
caddy reload --config /etc/caddy/Caddyfile

# 10. Cleanup
echo "🧹 Cleaning up..."
kill $NEW_PID 2>/dev/null || true
rm -f logs/new-instance.log

echo ""
echo "✅ Deployment completed successfully!"
echo "🎉 Site is now running version: $NEW_VERSION (commit: $GIT_COMMIT)"
echo "📊 Monitoring: journalctl -u jobai-frontend -f"
