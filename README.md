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

## 📦 Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/stud-iq/campus-store.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Environment Variables (`.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_SOLANA_RPC_URL=...
   NEXT_PUBLIC_ADMIN_EMAIL=your_email@example.com
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 📝 Recent Updates
- **v1.2 - Optimization**: Added global price caching to speed up checkout flow significantly.
- **v1.1 - Admin Security**: Enhanced admin route protection with email-based verification.
- **v1.0 - Hybrid Payments**: Launched support for USDC and SOL dynamic payments.
