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

### 💳 Web3 Wallet Dashboard
- **Smart Portfolio**: Multi-token support (SOL, USDC) with real-time USD valuation.
- **Real-time Pricing**: Integrated with **Jupiter Price API** for accurate, instant token valuations.
- **Privacy First**: Optional balance visibility toggle and secure address copying.
- **Seamless Transfers**: One-click Send and Receive functionality with QR support.
- **Multi-Network**: Easy switching between Solana **Mainnet** and **Devnet**.

### 🇳🇬 Paj Cash (Naira On/Off Ramp)
- **Naira to USDC (Onramp)**: Buy crypto directly with local bank transfers.
- **USDC to Naira (Offramp)**: Sell crypto and withdraw funds directly to 20+ supported Nigerian banks.
- **Automated Verification**: Real-time bank account resolution and secure OTP verification.
- **Premium UX**: Mobile-responsive flow with automated order tracking.

### 🤖 AI Campus Assistant (Studi)
- **Intelligent Support**: AI-powered shopping buddy (Gemini Flash) to help with product info and FAQs.
- **Context-Aware**: Understands campus delivery routes, reward systems, and seller guidelines.
- **Hybrid Support**: Integrated WhatsApp escalation for direct human assistance.

### 🏪 For Sellers
- **Store Dashboard**: Comprehensive view of sales, orders, and products.
- **Shareable Stores**: Custom storefront links to share directly with customers.
- **Inventory Management**: Real-time stock tracking and editing.
- **Secure Withdrawals**: Request payouts directly to your Solana wallet.

### 👤 Identity & Security
- **Civic Auth Integration**: Secure login using Email or Wallet, verified on-chain.
- **Student Onboarding**: Streamlined profile setup for school, campus, and level tracking.
- **Verified Profiles**: Student identity verification for trust and safety.

### 🔮 Prediction Markets (Coming Soon)
- **Campus Predictions**: Trade on future campus events and outcomes using SOL/USDC.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Solana (Web3.js + Jupiter API)
- **Payments/Ramp**: Paj Cash SDK
- **AI**: Google Gemini API
- **Styling**: Vanilla CSS + TailwindCSS
- **State Management**: Zustand
- **Auth**: Civic Auth + Supabase
- **Email**: Resend

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

### Paj Cash (Ramp) & Payments

| Variable | Description |
|----------|-------------|
| `PAJ_BUSINESS_API_KEY` | Your Paj Cash business API key |
| `PAJ_ENVIRONMENT` | `production` or `staging` |
| `PAJ_WEBHOOK_URL` | URL for payment notifications |
| `NEXT_PUBLIC_PLATFORM_WALLET` | Platform wallet receiving fees and liquidity |
| `NEXT_PUBLIC_USDC_MINT` | USDC token mint address |

### AI & Support

| Variable | Description |
|----------|-------------|
| `GOOGLE_GEMINI_API_KEY` | API key for Studi AI assistant |
| `NEXT_PUBLIC_ADMIN_WHATSAPP` | Support phone number (e.g. 234...) |

### Email & Notifications

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for emails |
| `RESEND_FROM_EMAIL` | Sender email address |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push notification public key |
| `VAPID_PRIVATE_KEY` | Push notification private key |

---

## 🌐 Switching to Mainnet

To deploy to mainnet, update your `.env`:

```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://your-mainnet-rpc.com  # Helius, QuickNode, etc.
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v  # Mainnet USDC
PAJ_ENVIRONMENT=production
```

**Important Mainnet Checklist:**
- [ ] Get a production RPC from Helius or QuickNode
- [ ] Update USDC mint to mainnet address
- [ ] Set `PAJ_ENVIRONMENT=production`
- [ ] Test with small transactions first

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

- **v1.5 - Wallet History & Paj Receipts**
  - Fixed SOL/USDC balances to use the configured Helius RPC and correct token amounts.
  - Upgraded transaction history with colored deposit/withdraw arrows, Paj Cash labels, expandable details, and clearer error states.
  - Added Web3-style Paj Cash PDF receipts with per-type theming and accurate NGN/USDC breakdown.
  - Implemented `/api/ramp/resolve-account` and auto bank account verification for Naira withdrawals.
- **v1.4 - Wallet & Ramp UI**: Complete overhaul of the Wallet dashboard and Paj Cash integration with direct Withdraw/Deposit flows.
- **v1.3 - Security**: Removed test endpoints, improved mainnet configuration.
- **v1.2 - Optimization**: Added global price caching to speed up checkout flow significantly.
- **v1.1 - Admin Security**: Enhanced admin route protection with email-based verification.
- **v1.0 - Hybrid Payments**: Launched support for USDC and SOL dynamic payments.

---

## 📄 License

Private repository - All rights reserved.
