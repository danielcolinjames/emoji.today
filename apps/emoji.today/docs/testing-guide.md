# Testing the NFT Minting Feature

This guide explains how to test the "Mint your vote" functionality locally using Base Sepolia testnet.

## Local Testing Strategy

### 1. Use Base Sepolia Testnet

Yes, **Base Sepolia is the best approach** for local testing! Here's why:
- Free test ETH and USDC
- Same contract interfaces as mainnet
- No risk of losing real money
- Fast transaction times

### 2. Getting Test Funds to Your Farcaster Wallet

#### Option A: Direct Faucet (Easiest)
1. **Find your Farcaster wallet address**:
   - Open Warpcast app
   - Go to Settings → Wallet
   - Copy your wallet address

2. **Get Base Sepolia ETH**:
   - Visit [Base Sepolia Faucet](https://faucet.quicknode.com/base/sepolia)
   - Or [Coinbase Wallet Faucet](https://docs.base.org/tools/network-faucets/)
   - Paste your Farcaster wallet address
   - Request test ETH

3. **Get Test USDC**:
   - Use [Circle's USDC Faucet](https://faucet.circle.com/) (if available)
   - Or bridge test USDC from other testnets
   - Contract address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

#### Option B: Bridge from Other Testnets
1. Get ETH on Ethereum Sepolia from [sepoliafaucet.net](https://sepoliafaucet.net/)
2. Use [Base Bridge](https://bridge.base.org/) to move to Base Sepolia
3. Swap some ETH for test USDC on Base Sepolia

#### Option C: Manual Transfer
1. Create a temporary wallet with test funds
2. Send Base Sepolia ETH and USDC to your Farcaster wallet
3. Use MetaMask or any wallet to send the funds

## Local Development Setup

### 1. Environment Configuration

Create `.env.local` in `apps/emoji.today/`:

```bash
# Existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=https://lgkbapfskatvfrsnxcys.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Existing Farcaster config
NEYNAR_API_KEY=your_neynar_key
NEYNAR_CLIENT_ID=your_neynar_client

# NextAuth
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# Frame config
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_FRAME_NAME=emoji.today
USE_TUNNEL=true

# NEW: Blockchain config for testing
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x_your_deployed_contract
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
THIRDWEB_SECRET_KEY=your_thirdweb_secret
PRIVATE_KEY=0x_your_backend_wallet_private_key
```

### 2. Testing Workflow

1. **Start local development**:
   ```bash
   cd apps/emoji.today
   yarn dev
   ```

2. **Access via tunnel**: Use the localtunnel URL to test in Warpcast

3. **Test the voting flow**:
   - Sign in with Farcaster
   - Vote for an emoji
   - Navigate to the ReviewVote screen

4. **Test NFT minting**:
   - Click "Mint your vote" button
   - Connect your Farcaster wallet (should auto-connect)
   - Confirm the transaction
   - Verify NFT appears in your wallet

### 3. Debugging Tools

#### Check Wallet Balance
```javascript
// In browser console
const address = "your_farcaster_wallet_address";
console.log("ETH Balance:", await window.ethereum.request({
  method: 'eth_getBalance',
  params: [address, 'latest']
}));
```

#### Verify Network
- Ensure your wallet is connected to Base Sepolia (Chain ID: 84532)
- Check RPC URL: `https://sepolia.base.org`

#### Transaction Monitoring
- Use [Base Sepolia Explorer](https://sepolia.basescan.org/)
- Watch for contract interactions and token transfers

## Common Testing Scenarios

### 1. First-Time User Flow
- New user signs up via Farcaster
- Votes for the first time
- Tries to mint → should prompt to connect wallet
- Connects wallet → should show mint button
- Mints successfully → should show success message

### 2. Returning User Flow
- User has already connected wallet
- Votes again on a new day
- Mint button should work immediately
- Should not allow minting same vote twice

### 3. Error Scenarios
- User has no USDC → should show clear error message
- User on wrong network → should prompt to switch
- Backend signature fails → should show retry option
- Contract interaction fails → should display transaction link

## Testing Checklist

### Pre-Development
- [ ] Base Sepolia ETH in Farcaster wallet
- [ ] Test USDC in Farcaster wallet  
- [ ] NFT contract deployed and configured
- [ ] Backend wallet has MINTER role
- [ ] Environment variables set correctly

### Functionality Testing
- [ ] Vote successfully recorded
- [ ] Mint button appears on ReviewVote screen
- [ ] Mint button appears on VotingResults screen
- [ ] Wallet connection works
- [ ] USDC payment processes correctly
- [ ] NFT mints to correct address
- [ ] Dynamic metadata generates correctly
- [ ] Transaction hash displays properly

### Edge Cases
- [ ] User tries to mint twice (should prevent)
- [ ] User has insufficient USDC (should show error)
- [ ] User on wrong network (should prompt switch)
- [ ] Backend is down (should show error)
- [ ] Transaction fails (should allow retry)

## Getting Help

### If You Need Test Funds
1. **ETH**: Use multiple faucets if daily limits are low
2. **USDC**: Join Discord/Telegram groups for testnet communities
3. **Emergency**: Create issue in project repo for assistance

### If Wallet Won't Connect
1. **Clear browser cache** and try again
2. **Check network settings** in wallet
3. **Try different wallet** (MetaMask, Coinbase Wallet)
4. **Use browser inspector** to check for JavaScript errors

### If Minting Fails
1. **Check contract permissions** (MINTER role)
2. **Verify environment variables** are loaded
3. **Check API endpoint logs** for detailed errors
4. **Monitor network requests** in browser dev tools

## Production Readiness

Before deploying to mainnet:

1. **Complete all test scenarios** on Base Sepolia
2. **Test with multiple users** and wallet types
3. **Monitor gas costs** and optimize if needed
4. **Set up error tracking** (Sentry, LogRocket, etc.)
5. **Deploy contracts to Base Mainnet**
6. **Update environment variables** for production
7. **Test small amounts** with real USDC first

## Cost Estimates

### Base Sepolia (Testing)
- **Contract deployment**: Free (test ETH)
- **Minting transactions**: Free (test ETH)
- **Test USDC**: Free from faucets

### Base Mainnet (Production)
- **Contract deployment**: ~$10-20 USD
- **Per mint transaction**: ~$1-3 USD gas + $1 USDC
- **Backend operations**: ~$0.50 USD per signature

Remember: Always test thoroughly on Base Sepolia before moving to mainnet! 