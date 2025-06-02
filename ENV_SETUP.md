# Environment Configuration Guide for emoji.today

## Overview
This guide helps you set up separate staging and production environments to prevent accidental production changes.

## Recommended Structure

### For Web App (`apps/emoji.today`)

1. **Create these files** (add them to `.gitignore`):
   - `.env.staging` - Staging environment variables
   - `.env.production` - Production environment variables
   - `.env.local` - Active environment (symlink or copy)

2. **File contents**:

```bash
# .env.staging
NEXT_PUBLIC_SUPABASE_URL=https://rlhcjdxokgdzwxevqjtr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_ENVIRONMENT=staging

# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://lgkbapfskatvfrsnxcys.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXTAUTH_URL=https://emoji.today
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_ENVIRONMENT=production
```

### For Jobs (`apps/jobs`)

1. **Create these files** (add them to `.gitignore`):
   - `.env.staging` - Staging environment variables
   - `.env.production` - Production environment variables
   - `.env` - Active environment (symlink or copy)

2. **File contents**:

```bash
# .env.staging
SUPABASE_URL=https://rlhcjdxokgdzwxevqjtr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key

# .env.production
SUPABASE_URL=https://lgkbapfskatvfrsnxcys.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

## Switching Environments

### Option 1: Using Symlinks (Recommended)

```bash
# Switch to staging (default for development)
cd apps/emoji.today
ln -sf .env.staging .env.local

cd ../jobs
ln -sf .env.staging .env

# Switch to production (only when needed)
cd apps/emoji.today
ln -sf .env.production .env.local

cd ../jobs
ln -sf .env.production .env
```

### Option 2: Using Scripts

Create these helper scripts in your root directory:

```bash
# use-staging.sh
#!/bin/bash
echo "Switching to STAGING environment..."
cp apps/emoji.today/.env.staging apps/emoji.today/.env.local
cp apps/jobs/.env.staging apps/jobs/.env
echo "✅ Now using STAGING environment"

# use-production.sh
#!/bin/bash
echo "⚠️  WARNING: Switching to PRODUCTION environment!"
read -p "Are you sure? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    cp apps/emoji.today/.env.production apps/emoji.today/.env.local
    cp apps/jobs/.env.production apps/jobs/.env
    echo "🔴 Now using PRODUCTION environment - BE CAREFUL!"
else
    echo "Cancelled."
fi
```

### Option 3: Using package.json scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "env:staging": "yarn workspace emoji.today env:staging && yarn workspace emoji-today-jobs env:staging",
    "env:production": "yarn workspace emoji.today env:production && yarn workspace emoji-today-jobs env:production"
  }
}
```

And in each workspace's `package.json`:

```json
// apps/emoji.today/package.json
{
  "scripts": {
    "env:staging": "cp .env.staging .env.local",
    "env:production": "cp .env.production .env.local"
  }
}

// apps/jobs/package.json
{
  "scripts": {
    "env:staging": "cp .env.staging .env",
    "env:production": "cp .env.production .env"
  }
}
```

## Visual Indicators

Add a visual indicator to your app to always know which environment you're in:

```tsx
// apps/emoji.today/src/components/EnvironmentBadge.tsx
export function EnvironmentBadge() {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT;
  
  if (env === 'production') return null; // Don't show in production
  
  return (
    <div className="fixed top-0 left-0 bg-yellow-500 text-black px-2 py-1 text-xs font-bold z-50">
      {env?.toUpperCase() || 'UNKNOWN'}
    </div>
  );
}
```

## Best Practices

1. **Default to staging**: Always use staging for development
2. **Production safeguards**: Add confirmation prompts when switching to production
3. **Visual indicators**: Show which environment you're in
4. **Separate branches**: Use git branches that match your Supabase branches
5. **CI/CD**: Use GitHub Actions or Vercel environment variables for deployments

## Gitignore

Add to `.gitignore`:

```
# Environment files
.env
.env.local
.env.staging
.env.production
.env.*.local

# But allow examples
!.env.example
!.env.local.example
```

## Next Steps

1. Copy your current `.env.local` values to `.env.staging`
2. Get production values and create `.env.production`
3. Set up your preferred switching method
4. Always start with staging environment
5. Add visual indicators to your app

## Supabase Branch Reference

- **Production**: `lgkbapfskatvfrsnxcys` (main branch)
- **Staging**: `rlhcjdxokgdzwxevqjtr` (staging branch) 