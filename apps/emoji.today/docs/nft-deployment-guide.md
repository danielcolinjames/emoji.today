# NFT Contract Deployment Guide

This guide walks you through deploying the NFT contract for emoji.today's "Mint your vote" functionality.

## Prerequisites

1. **Wallet Setup**: You need a wallet with Base Sepolia ETH for deployment
2. **Thirdweb Account**: Sign up at [thirdweb.com](https://thirdweb.com)
3. **Base Sepolia Testnet Funds**: Get ETH from [Base Sepolia faucet](https://faucet.quicknode.com/base/sepolia)

## Step 1: Deploy the NFT Contract

### Option A: Using Thirdweb Dashboard (Recommended)

1. Go to [thirdweb.com/dashboard](https://dashboard.thirdweb.com/)
2. Click "Deploy new contract"
3. Choose "NFT Drop" contract
4. Configure:
   - **Name**: "emoji.today Vote Badges"
   - **Symbol**: "EMOJI"
   - **Description**: "NFT vote badges for emoji.today daily voting"
   - **Image**: Upload an emoji.today logo
   - **Primary Sale Recipient**: Your wallet address
   - **Royalty Recipient**: Your wallet address
   - **Royalty %**: 0% (or 2.5% if you want royalties)
   - **Platform Fee**: 0%

5. Select **Base Sepolia Testnet** as the network
6. Deploy the contract
7. Copy the contract address

### Option B: Using Thirdweb CLI

```bash
npx thirdweb deploy
```

Then follow the web interface to configure your contract.

## Step 2: Configure Environment Variables

Add these to your `.env.local` file in `apps/emoji.today/`:

```bash
# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# Contract Addresses
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x_YOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key

# Private key for backend operations (create a new wallet for this)
PRIVATE_KEY=0x_your_private_key_here
```

## Step 3: Get Thirdweb API Keys

1. Go to [thirdweb.com/dashboard/settings/api-keys](https://dashboard.thirdweb.com/settings/api-keys)
2. Create a new API key
3. Copy the Client ID (public) and Secret Key (private)
4. Add them to your environment variables

## Step 4: Set Up Backend Wallet

1. Create a new wallet for backend operations (don't use your main wallet)
2. Add the private key to `PRIVATE_KEY` in `.env.local`
3. Send some Base Sepolia ETH to this wallet for gas fees
4. In Thirdweb dashboard, grant this wallet "MINTER" role on your NFT contract:
   - Go to your contract dashboard
   - Click "Permissions" tab
   - Add your backend wallet address as a MINTER

## Step 5: Test the Setup

1. Run the development server:
   ```bash
   yarn dev
   ```

2. Navigate to `/vote` and complete a vote
3. Try the "Mint your vote" button
4. Connect a wallet with Base Sepolia ETH and test USDC
5. Confirm the minting flow works

## Step 6: Get Test USDC

For testing on Base Sepolia, you'll need test USDC:

1. Use Base Sepolia USDC faucet (if available)
2. Or use a bridge to get test USDC
3. The contract address is: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Step 7: Production Deployment

When ready for mainnet:

1. Deploy the same contract on Base Mainnet (Chain ID: 8453)
2. Update environment variables:
   ```bash
   NEXT_PUBLIC_CHAIN_ID=8453
   NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
   NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
   ```
3. Test thoroughly on testnet first!

## Troubleshooting

### Contract Not Found Error
- Verify the contract address is correct
- Ensure you're on the right network (Base Sepolia)
- Check that the contract has signature minting enabled

### Wallet Connection Issues
- Make sure Thirdweb provider is properly configured
- Check that the user's wallet supports Base network
- Verify environment variables are loaded

### Minting Failures
- Ensure backend wallet has MINTER role
- Check that user has enough USDC for payment
- Verify gas fee allowances

### API Errors
- Check Thirdweb API keys are correct
- Ensure private key format is correct (with 0x prefix)
- Verify all environment variables are set

## Next Steps

Once deployed and tested:

1. **Monitor Usage**: Track minting metrics in Thirdweb dashboard
2. **Update UI**: Add success animations and better error handling
3. **Marketing**: Announce the NFT feature to users
4. **Analytics**: Add tracking for minting conversions

## Security Notes

- Never commit private keys to git
- Use different wallets for testing and production
- Set appropriate rate limits on your API endpoints
- Consider implementing user allowlists for beta testing 