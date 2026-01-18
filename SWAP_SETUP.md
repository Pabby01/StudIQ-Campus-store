# Environment Variables for Swap Feature

Add the following to your `.env.local` file:

```bash
# Platform Wallet Configuration
NEXT_PUBLIC_PLATFORM_WALLET=Hx912yR4vDEwUqQNUZcaxwsjmE8B6Lq6grokrPh8a6Js
PLATFORM_WALLET_PRIVATE_KEY=your_base58_encoded_private_key_here

# USDC Mint Address (Devnet)
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# App URL (for API calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Your Platform Wallet Private Key

1. **Export from Phantom/Solflare:**
   - Go to Settings → Show Private Key
   - Copy the private key (base58 format)

2. **Or generate a new keypair:**
   ```bash
   solana-keygen new --outfile platform-wallet.json
   ```

3. **Convert to base58:**
   ```bash
   # The private key in the JSON file needs to be base58 encoded
   # You can use a tool or script to convert it
   ```

## Security Notes

⚠️ **CRITICAL**: Never commit `.env.local` to git!
⚠️ The platform wallet private key gives full access to the wallet
⚠️ For production, use a secure key management system (AWS KMS, HashiCorp Vault, etc.)

## Funding the Platform Wallet

For swaps to work, the platform wallet needs liquidity in both SOL and USDC:

```bash
# Get devnet SOL (airdrop)
solana airdrop 2 YOUR_PLATFORM_WALLET_ADDRESS --url devnet

# Get devnet USDC
# Visit: https://spl-token-faucet.com/
# Or use Solana CLI to create and mint USDC tokens
```
