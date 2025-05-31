# emoji.today Admin Dashboard

A password-protected admin dashboard for monitoring live votes and looking up users.

## Features

- **Live Vote Monitoring**: Real-time display of incoming votes with 5-second refresh rate
- **Vote Statistics**: Today's total votes, unique voters, and leading emoji
- **User Lookup**: Search users by FID and get their Farcaster profile info via Neynar
- **Password Protection**: Simple password authentication (not discoverable via web)
- **Real-time Updates**: Uses SWR for live data updates

## Setup

1. Copy environment variables from the main emoji.today app
2. Set `ADMIN_PASSWORD` to a secure password
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (for admin database access)
4. Set `NEYNAR_API_KEY` for user lookup functionality

## Running

```bash
cd apps/admin
yarn dev
```

The admin dashboard will run on `http://localhost:3001`

## Security

- Password protected with localStorage session
- No search engine indexing (`robots: noindex, nofollow`)
- Uses Supabase service role for read-only admin access
- Separate from main production app

## Default Password

`emoji-admin-2024` (change this in production!) 