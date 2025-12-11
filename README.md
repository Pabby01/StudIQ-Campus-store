# StudiQ Campus Store

A decentralized campus marketplace built on Solana and Next.js.

## 🚀 Features

### For Buyers
- **Browse Products**: Explore a wide range of campus essentials.
- **Crypto Payments**: Securely pay with SOL or USDC via Solana Pay.
- **Pay on Delivery (POD)**: Option to pay in cash upon receipt/pickup for verified items.
- **Shopping Cart**: Manage items and checkout seamlessly.
- **Receipts**: Download professional PDF receipts for all orders.
- **Wallet Connection**: Connect Phantom or Solflare for seamless web3 integration.

### For Sellers
- **Store Dashboard**: Manage your store, products, and incoming orders.
- **Product Management**: 
    - Upload multiple product images (Gallery view).
    - Edit and Delete products.
    - specialized categories.
- **Order Management**: View new orders, mark as Shipped or Completed.
- **Inventory Tracking**: Real-time stock management.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Solana (Web3.js)
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **PDF Generation**: jsPDF + html2canvas

## 📦 Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/your-repo/campus-store.git
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
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 📝 Recent Updates
- **Multi-Image Support**: Products now support up to 10 images with a carousel view.
- **Pay on Delivery**: Integrated POD availability for products and checkout flow.
- **Order Receipts**: Automated PDF receipt validation and download page.
- **Seller Tools**: Enhanced dashboard for order tracking and product editing.
