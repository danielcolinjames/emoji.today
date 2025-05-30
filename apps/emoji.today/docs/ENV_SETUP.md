# Environment Setup for NFT Minting

## Required Environment Variables

Copy these to your `.env.local` (development) or deployment environment:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Project IDs
# Production: lgkbapfskatvfrsnxcys
# Staging: rlhcjdxokgdzwxevqjtr
NEXT_PUBLIC_SUPABASE_PROJECT_ID=lgkbapfskatvfrsnxcys

# Thirdweb Configuration (for NFT minting)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
THIRDWEB_SECRET_KEY=your_secret_key_here
THIRDWEB_PRIVATE_KEY=your_private_key_here

# NFT Contract Address (deploy via Thirdweb dashboard)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...

# App Configuration
NEXT_PUBLIC_URL=https://emoji.today
NEXTAUTH_URL=https://emoji.today
NEXTAUTH_SECRET=your-nextauth-secret

# Neynar API (for Farcaster integration)
NEYNAR_API_KEY=your-neynar-api-key

# Development vs Production
NODE_ENV=development
```

## Quick Setup for Testing

1. **Use Staging Database**:
   ```bash
   NEXT_PUBLIC_SUPABASE_PROJECT_ID=rlhcjdxokgdzwxevqjtr
   NODE_ENV=development
   ```

2. **Get Thirdweb Keys**:
   - Go to [Thirdweb Dashboard](https://thirdweb.com/dashboard)
   - Create account/login
   - Get Client ID and Secret Key from API Keys section
   - Generate a private key for contract deployment

3. **Deploy Test Contract**:
   - Use Base Sepolia testnet
   - Deploy "NFT Drop" contract
   - Copy contract address

4. **Get Test ETH**:
   - [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
   - Connect your Farcaster wallet
   - Get 0.1 ETH for testing

## Security Notes

- **Never commit** `.env.local` or private keys to git
- **Use staging** database for all testing
- **Rotate keys** if accidentally exposed
- **Monitor usage** on Thirdweb dashboard

## Testing Checklist

- [ ] Environment variables set
- [ ] Staging database connected
- [ ] Test contract deployed
- [ ] Test ETH in wallet
- [ ] Vote created in staging
- [ ] Mint button appears
- [ ] Minting works
- [ ] Duplicate prevention works 