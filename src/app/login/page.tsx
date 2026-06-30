"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@civic/auth-web3/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { Loader2, ArrowRight } from "lucide-react";
import CivicAuthButton from "@/components/CivicAuthButton";
import { motion, AnimatePresence } from "framer-motion";

// Type guard
function hasWallet(user: any): user is { solana: { address: string; wallet: any } } {
  return user && typeof user === 'object' && 'solana' in user && user.solana && 'address' in user.solana;
}

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const userContext = useUser();
  const { user, isLoading } = userContext;

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });

  const images = [
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ];
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && !isLoading) {
      const u = user as any;
      if (hasWallet(user)) setWalletAddress(user.solana.address);
      else if (u.solana?.address) setWalletAddress(u.solana.address);
    }
  }, [user, isLoading]);

  const token = (userContext as any).idToken || (userContext as any).token || null;
  const userAny = user as any;
  const civicUserId = userAny?.id || userAny?.sub || null;

  useEffect(() => {
    if (!mounted || isLoading || !user || !token) return;
    const addressToUse = walletAddress || (civicUserId ? `civic_${civicUserId}` : null);
    if (!addressToUse) return;

    // Login process
    const handleLogin = async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, address: addressToUse }),
        });
        
        if (res.ok) {
            router.push("/dashboard");
        } else {
            toast.error("Login Failed", "Could not verify your identity. Please try again.");
        }
      } catch (err) {
        toast.error("Error", "An unexpected error occurred during login.");
      }
    };
    
    handleLogin();
  }, [mounted, isLoading, user, token, walletAddress, civicUserId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8 pt-24">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[800px]">
        {/* Left side: Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-sm w-full mx-auto space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-slate-500 mt-2">Log in to access your dashboard and campus stores.</p>
            </div>

            <div className="space-y-4">
              <Input 
                label="Username" 
                name="username" 
                placeholder="Enter your username" 
                value={formData.username} 
                onChange={handleInputChange} 
              />
              <Input 
                label="Email Address" 
                name="email" 
                type="email" 
                placeholder="Enter your email" 
                value={formData.email} 
                onChange={handleInputChange} 
              />
              
              <div className="pt-4">
                {!user ? (
                  <div className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center">
                    <p className="text-sm text-slate-500 mb-4 text-center">Securely authenticate with Civic to continue</p>
                    <CivicAuthButton />
                  </div>
                ) : (
                  <div className="flex justify-center p-4">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don't have an account? <button onClick={() => router.push('/signup')} className="text-blue-600 font-semibold hover:underline">Sign up</button>
              </p>
            </div>
          </div>
        </div>
        
        {/* Right side: Image Carousel */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentImg}
              src={images[currentImg]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              alt="Students studying"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative z-10 p-12 max-w-xl text-center">
            <h1 className="text-5xl font-black mb-6 leading-tight text-white drop-shadow-lg">Welcome back to the store.</h1>
            <p className="text-xl text-slate-100 font-medium drop-shadow-md">
              Continue where you left off. Manage your store, discover items, and earn more points.
            </p>
            <div className="mt-8 flex justify-center gap-2">
              {images.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentImg ? 'bg-white w-6' : 'bg-white/50'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
