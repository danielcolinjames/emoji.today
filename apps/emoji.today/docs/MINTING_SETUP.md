# NFT Minting Setup Guide

## Quick Setup for Production

### 1. Environment Variables

Add these to your production environment (Vercel/Railway):

```bash
# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
THIRDWEB_SECRET_KEY=your_secret_key_here
THIRDWEB_PRIVATE_KEY=your_private_key_here

# NFT Contract
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=your_contract_address_here

# Database (use staging for testing)
# Production: lgkbapfskatvfrsnxcys
# Staging: rlhcjdxokgdzwxevqjtr
NEXT_PUBLIC_SUPABASE_PROJECT_ID=lgkbapfskatvfrsnxcys
```

### 2. Deploy NFT Contract

1. Go to [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Click "Deploy new contract"
3. Choose "NFT Drop" 
4. Configure:
   - **Name**: "emoji.today Vote Badges"
   - **Symbol**: "EMOJI"
   - **Description**: "Daily vote commemoration NFTs from emoji.today"
   - **Network**: Base (production) or Base Sepolia (testing)
   - **Primary Sale Recipient**: Your wallet address
   - **Royalty Recipient**: Your wallet address  
   - **Royalty Percentage**: 5% (or your preference)

5. Deploy and copy the contract address to `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS`

### 3. Security Checklist

- [ ] **Private Key Security**: Store `THIRDWEB_PRIVATE_KEY` securely, never commit to git
- [ ] **Rate Limiting**: API routes have built-in duplicate prevention
- [ ] **Authentication**: All mint endpoints require Farcaster authentication
- [ ] **Vote Verification**: Users can only mint NFTs for emojis they actually voted for
- [ ] **Duplicate Prevention**: Database constraints prevent double-minting
- [ ] **Environment Separation**: Use staging database for testing

### 4. Testing Flow

1. **Use Staging Environment**:
   ```bash
   # In your .env.local for development
   NEXT_PUBLIC_SUPABASE_PROJECT_ID=rlhcjdxokgdzwxevqjtr
   NODE_ENV=development
   ```

2. **Get Test Funds**:
   - Go to [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
   - Connect your Farcaster wallet
   - Get 0.1 ETH for testing

3. **Test the Flow**:
   - Vote for an emoji in staging
   - Try to mint the NFT (should work)
   - Try to mint again (should fail with "already minted")
   - Try to mint a different emoji you didn't vote for (should fail)

## Advanced Security Features

### Rate Limiting (Future Enhancement)
```typescript
// Add to API route for production hardening
const rateLimiter = new Map();
const RATE_LIMIT = 5; // 5 mints per hour per user
const WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(fid: string): boolean {
  const now = Date.now();
  const userLimits = rateLimiter.get(fid) || [];
  
  // Remove old entries
  const validLimits = userLimits.filter((time: number) => now - time < WINDOW);
  
  if (validLimits.length >= RATE_LIMIT) {
    return false; // Rate limited
  }
  
  validLimits.push(now);
  rateLimiter.set(fid, validLimits);
  return true;
}
```

### Webhook Verification (Future Enhancement)
```typescript
// Verify minting actually happened on-chain
async function verifyMintOnChain(txHash: string, expectedRecipient: string) {
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
  // Verify the transaction succeeded and went to the right address
  return receipt.status === 'success' && 
         receipt.logs.some(log => log.topics.includes(expectedRecipient));
}
```

## Troubleshooting

### Common Issues

1. **"Server configuration error"**
   - Check all environment variables are set
   - Verify Thirdweb client ID and secret key

2. **"Invalid wallet address format"**
   - Ensure wallet address starts with 0x and is 42 characters
   - Check Farcaster user has connected wallet

3. **"Vote not found"**
   - User must vote first before minting
   - Check vote_date format (YYYY-MM-DD)

4. **"NFT already minted"**
   - Each vote can only be minted once
   - Use cleanup function in development only

### Development Cleanup
```bash
# If you need to reset mint records in development
npm run dev
# Then in the app, the cleanup function will be available
```

## Database Schema

The `vote_nfts` table structure:
```sql
CREATE TABLE vote_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES votes(id),
  wallet_address TEXT NOT NULL,
  signature_payload JSONB NOT NULL,
  signature TEXT NOT NULL,
  mint_price_usdc NUMERIC NOT NULL,
  transaction_hash TEXT,
  minted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate mints
  UNIQUE(vote_id)
);
```

## Production Deployment

1. **Environment Variables**: Set all required vars in Vercel
2. **Contract Deployment**: Deploy to Base mainnet
3. **Database**: Use production Supabase project
4. **Monitoring**: Watch logs for any minting errors
5. **Backup**: Ensure database backups are enabled

## Cost Estimation

- **Base Network**: ~$0.001-0.01 per transaction
- **Thirdweb**: Free tier covers most usage
- **Supabase**: Staging branch costs $0.01344/hour
- **User Cost**: 0.001 ETH (~$3-4) per mint

## Next Steps for 1/1 NFT Auction

The infrastructure is ready for:
1. **Daily Winner NFT**: Mint 1/1 of winning emoji
2. **Auction System**: 24-hour auction with transparent rules
3. **Prize Distribution**: Split proceeds among voters
4. **Automated Posting**: Social media integration

This minting system provides the foundation for the full emoji.today economy! 