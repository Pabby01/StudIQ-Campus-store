import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./scrollbar.css";
import Providers from "@/app/providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/hooks/useToast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StudIQ Campus Store - Decentralized Campus Marketplace on Solana",
    template: "%s | StudIQ Campus Store"
  },
  description: "Buy and sell campus essentials with cryptocurrency. StudIQ Campus Store is a decentralized marketplace built on Solana, offering secure crypto payments, pay-on-delivery options, and instant transactions for students.",
  keywords: ["campus marketplace", "solana payments", "crypto marketplace", "student marketplace", "decentralized commerce", "campus store", "buy sell college", "solana pay", "web3 marketplace"],
  authors: [{ name: "StudIQ Team" }],
  creator: "StudIQ",
  publisher: "StudIQ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://stud-iq-campus-store.vercel.app'),
  openGraph: {
    title: "StudIQ Campus Store - Decentralized Campus Marketplace",
    description: "Buy and sell campus essentials with cryptocurrency on Solana blockchain. Secure, fast, and student-friendly.",
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://stud-iq-campus-store.vercel.app',
    siteName: "StudIQ Campus Store",
    images: [
      {
        url: 'https://i.postimg.cc/VNXWGB8P/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'StudIQ Campus Store Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "StudIQ Campus Store - Decentralized Campus Marketplace",
    description: "Buy and sell campus essentials with cryptocurrency on Solana",
    images: ['https://i.postimg.cc/VNXWGB8P/logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: 'https://i.postimg.cc/VNXWGB8P/logo.jpg' },
      { url: 'https://i.postimg.cc/VNXWGB8P/logo.jpg', sizes: '32x32', type: 'image/jpeg' },
    ],
    apple: [
      { url: 'https://i.postimg.cc/VNXWGB8P/logo.jpg' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <Providers>
              <Navbar />
              <main className="pb-16 md:pb-0">
                {children}
              </main>
              <Footer />
              <MobileNav />
            </Providers>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
