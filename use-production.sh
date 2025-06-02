#!/bin/bash

echo "🔴 WARNING: Switching to PRODUCTION environment!"
echo "⚠️  This will affect REAL USER DATA!"
echo ""

# Extra safety check
read -p "Type 'production' to confirm: " confirmation

if [ "$confirmation" != "production" ]; then
    echo "❌ Cancelled. Staying on current environment."
    exit 1
fi

# Check if env files exist
if [ ! -f "apps/emoji.today/.env.production" ]; then
    echo "❌ Error: apps/emoji.today/.env.production not found!"
    echo "Please create it first with your production values."
    exit 1
fi

if [ ! -f "apps/jobs/.env.production" ]; then
    echo "❌ Error: apps/jobs/.env.production not found!"
    echo "Please create it first with your production values."
    exit 1
fi

# Final confirmation
echo ""
read -p "Are you REALLY sure? This is PRODUCTION! (yes/N) " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Cancelled. Good call! Staying safe."
    exit 1
fi

# Copy production env files
cp apps/emoji.today/.env.production apps/emoji.today/.env.local
cp apps/jobs/.env.production apps/jobs/.env

echo ""
echo "🔴 NOW USING PRODUCTION ENVIRONMENT - BE EXTREMELY CAREFUL!"
echo "🔴 Production Supabase URL: https://lgkbapfskatvfrsnxcys.supabase.co"
echo ""
echo "📌 Remember to switch back to staging when done:"
echo "   ./use-staging.sh" 