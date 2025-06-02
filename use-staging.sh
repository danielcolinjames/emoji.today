#!/bin/bash

echo "🟡 Switching to STAGING environment..."

# Check if env files exist
if [ ! -f "apps/emoji.today/.env.staging" ]; then
    echo "❌ Error: apps/emoji.today/.env.staging not found!"
    echo "Please create it first with your staging values."
    exit 1
fi

if [ ! -f "apps/jobs/.env.staging" ]; then
    echo "❌ Error: apps/jobs/.env.staging not found!"
    echo "Please create it first with your staging values."
    exit 1
fi

# Copy staging env files
cp apps/emoji.today/.env.staging apps/emoji.today/.env.local
cp apps/jobs/.env.staging apps/jobs/.env

echo "✅ Now using STAGING environment"
echo ""
echo "📝 Staging Supabase URL: https://rlhcjdxokgdzwxevqjtr.supabase.co"
echo "🔧 Remember: This is your safe development environment!" 