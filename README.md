# StudIQ Campus Store

## 🎥 Demo Video

<div>
  <a href="https://www.loom.com/share/4206d3449d95443ca81f35f321dd2ceb">
    <p>StudIQ Campus Store - Demo Video - Watch Video</p>
  </a>
  <a href="https://www.loom.com/share/4206d3449d95443ca81f35f321dd2ceb">
    <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/4206d3449d95443ca81f35f321dd2ceb-d9d0e7f5a7e8b1c8-full-play.gif">
  </a>
</div>

---

A decentralized campus marketplace built on Solana and Next.js, bridging the gap between web2 and web3 commerce for students.

## 🚀 Key Features

### 🛒 Checkout & Payments
- **Hybrid Checkout**: Pay seamlessly with **SOL** or **USDC**. Prices are automatically converted in real-time.
- **Dynamic Pricing**: Products listed in USD are accurately converted to crypto at the moment of purchase.
- **Pay on Delivery (POD)**: Option for cash payments on delivery for verified campus locations.
- **Optimized Performance**: Instant price fetching via global state caching for a lightning-fast checkout experience.

### 🏪 For Sellers
- **Store Dashboard**: Comprehensive view of sales, orders, and products.
- **Shareable Stores**: Custom storefront links to share directly with customers.
- **Inventory Management**: Real-time stock tracking and editing.
- **Secure Withdrawals**: Request payouts directly to your Solana wallet.

### 👤 Identity & Security
- **Civic Auth Integration**: Secure login using Email or Wallet, verified on-chain.
- **Admin Security**: Server-side authentication verifying admin credentials against the database.
- **Verified Profiles**: Student identity verification for trust and safety.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Solana (Web3.js + Jupiter API)
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Auth**: Civic Auth + Supabase
- **Email**: Resend
- **Rate Limiting**: Upstash Redis (optional)

---

## 📦 Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/stud-iq/campus-store.git
   cd campus-store
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Environment Variables - copy `env.example.txt` to `.env`:
   ```bash
   cp env.example.txt .env
   ```

4. Configure your `.env` file (see [Environment Variables](#environment-variables) section)

5. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🔐 Environment Variables

Create a `.env` file with the following variables:

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC endpoint |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` or `mainnet` |
| `NEXT_PUBLIC_CIVIC_CLIENT_ID` | Civic Auth client ID |

### Blockchain (Wallets & Tokens)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PLATFORM_WALLET` | Platform wallet receiving payments |
| `PLATFORM_WALLET_PRIVATE_KEY` | Private key for swap operations (server-only) |
| `NEXT_PUBLIC_USDC_MINT` | USDC token mint address |

### Email & Notifications

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for emails |
| `RESEND_FROM_EMAIL` | Sender email address |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push notification public key |
| `VAPID_PRIVATE_KEY` | Push notification private key |

### Admin & Security

| Variable | Description |
|----------|-------------|
| `ADMIN_ADDRESSES` | Comma-separated admin wallet addresses |
| `ADMIN_EMAIL` | Admin email for authentication |
| `ADMIN_ACCESS_CODE` | Admin panel access code |
| `SESSION_TOKEN_SECRET` | JWT secret for sessions |

---

## 🌐 Switching to Mainnet

To deploy to mainnet, update your `.env`:

```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://your-mainnet-rpc.com  # Use Helius, QuickNode, etc.
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v  # Mainnet USDC
```

**Important Mainnet Checklist:**
- [ ] Get a production RPC from Helius, QuickNode, or Triton
- [ ] Update USDC mint to mainnet address
- [ ] Set `NEXT_PUBLIC_SOLANA_NETWORK=mainnet`
- [ ] Test with small transactions first
- [ ] Rotate all API keys and secrets
- [ ] Enable 2FA on all wallets

---

## 🔒 Security Best Practices

### Protecting Your Environment Variables

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use Vercel Environment Variables** for production:
   - Go to Project Settings → Environment Variables
   - Add all secrets there (they're encrypted)
3. **Rotate keys regularly** - Especially after team changes
4. **Use different keys per environment** - Dev, staging, production

### For Production Deployment

1. **Vercel (Recommended)**:
   ```bash
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   ```

2. **Self-hosted**: Use a secrets manager (AWS Secrets Manager, HashiCorp Vault)

3. **Never expose server-side keys** with `NEXT_PUBLIC_` prefix

### What's Safe vs What's Secret

| ✅ Safe (NEXT_PUBLIC_) | 🔒 Secret (Server only) |
|------------------------|-------------------------|
| Supabase URL | Service Role Key |
| Supabase Anon Key | Platform Wallet Private Key |
| RPC URL | Admin Access Code |
| USDC Mint | Session Token Secret |
| Platform Wallet (public) | VAPID Private Key |
| Civic Client ID | API Keys (OpenAI, Resend) |

---

## 🧪 Testing

Run tests:
```bash
npm run test
```

Current test coverage:
- Cart operations (`cart.test.ts`)
- Platform fee calculations (`platformFees.test.ts`)

---

## 📝 Recent Updates

- **v1.3 - Security**: Removed test endpoints, improved mainnet configuration
- **v1.2 - Optimization**: Added global price caching to speed up checkout flow significantly
- **v1.1 - Admin Security**: Enhanced admin route protection with email-based verification
- **v1.0 - Hybrid Payments**: Launched support for USDC and SOL dynamic payments

---

## 📄 License

Private repository - All rights reserved.
