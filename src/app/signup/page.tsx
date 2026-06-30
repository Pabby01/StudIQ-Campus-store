"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Country, State, City } from "country-state-city";
import { useUser } from "@civic/auth-web3/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { Loader2, CheckCircle, Sparkles, Trophy, ArrowRight, Gift } from "lucide-react";
import { updateProfileSchema } from "@/lib/validators";
import CivicAuthButton from "@/components/CivicAuthButton";
import { motion, AnimatePresence } from "framer-motion";

// Type guard
function hasWallet(user: any): user is { solana: { address: string; wallet: any } } {
  return user && typeof user === 'object' && 'solana' in user && user.solana && 'address' in user.solana;
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const userContext = useUser();
  const { user, isLoading } = userContext;
  
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [referralCodeValue, setReferralCodeValue] = useState("");
  const [referralStatus, setReferralStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [referralOwner, setReferralOwner] = useState<string | null>(null);
  const [celebrationData, setCelebrationData] = useState<{ pointsEarned: number; name: string } | null>(null);

  const images = [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  ];
  const [currentImg, setCurrentImg] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    country: "",
    state: "",
    city: "",
    phone: "",
    primary_intent: "buying",
  });

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => formData.country ? State.getStatesOfCountry(formData.country) : [], [formData.country]);
  const cities = useMemo(() => formData.country && formData.state ? City.getCitiesOfState(formData.country, formData.state) : [], [formData.country, formData.state]);

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

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && !referralCodeValue) {
      setReferralCodeValue(ref.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
    }
  }, [searchParams, referralCodeValue]);

  const token = (userContext as any).idToken || (userContext as any).token || null;
  const userAny = user as any;
  const civicUserId = userAny?.id || userAny?.sub || null;

  useEffect(() => {
    if (!mounted || isLoading || !user || !token) return;
    if (typeof document !== "undefined" && document.cookie.includes("sid=")) return;
    const addressToUse = walletAddress || (civicUserId ? `civic_${civicUserId}` : null);
    if (!addressToUse) return;
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, address: addressToUse }),
    }).catch(() => {});
  }, [mounted, isLoading, user, token, walletAddress, civicUserId]);

  async function handleReferralBlur() {
    if (referralCodeValue.length !== 6) {
      setReferralStatus("idle");
      setReferralOwner(null);
      return;
    }
    setReferralStatus("checking");
    try {
      const res = await fetch(`/api/profile/referral/validate?code=${referralCodeValue}`);
      const data = await res.json();
      if (data.valid) {
        setReferralStatus("valid");
        setReferralOwner(data.name ?? null);
      } else {
        setReferralStatus("invalid");
        setReferralOwner(null);
      }
    } catch {
      setReferralStatus("idle");
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  async function submitProfile() {
    if (!walletAddress && !civicUserId) return;
    
    setLoading(true);
    const address = walletAddress || `civic_${civicUserId}`;
    const userEmail = user && "email" in user ? (user.email as string) : formData.email;

    const profileData = {
      address,
      email: userEmail,
      civic_user_id: civicUserId,
      name: formData.name,
      username: formData.username,
      country: formData.country,
      state: formData.state,
      city: formData.city,
      phone: formData.phone,
      primary_intent: formData.primary_intent,
      verified_email: true,
      ...(referralCodeValue ? { referralCode: referralCodeValue } : {}),
    };

    const result = updateProfileSchema.safeParse(profileData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
      const formatted: { [key: string]: string } = {};
      for (const key in fieldErrors) {
        if (fieldErrors[key]?.length) formatted[key] = fieldErrors[key][0];
      }
      setErrors(formatted);
      toast.error("Invalid input", "Please check the form fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        const resData = await res.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("studiq_welcome_tour_seen", "true");
        }
        setCelebrationData({
          pointsEarned: resData.pointsEarned ?? 150,
          name: formData.name.split(" ")[0] || "Student",
        });
      } else {
        const error = await res.json();
        if (res.status === 409) {
          setErrors({ ...errors, username: "Username is already taken" });
        }
        toast.error("Failed to sign up", error.error || "Please try again");
      }
    } catch (error) {
      toast.error("Error", "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  // Once authenticated via Civic, auto-submit if form is filled
  useEffect(() => {
    if (user && formData.name && formData.username && !celebrationData && !loading) {
      submitProfile();
    }
  }, [user]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (celebrationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <AnimatePresence>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
            <div className="p-8 text-center bg-white rounded-3xl shadow-2xl">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {celebrationData.name}!</h1>
              <p className="text-gray-500 mb-6">Your identity is secured and ready.</p>
              
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-600 uppercase">Welcome Bonus</span>
                </div>
                <div className="text-4xl font-black text-blue-600">+{celebrationData.pointsEarned}</div>
                <div className="text-sm text-gray-500">StudIQ Points</div>
              </div>

              <Button onClick={() => router.push("/dashboard")} className="w-full flex justify-center gap-2 py-3">
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8 pt-24">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[800px]">
        {/* Left side: Image Carousel */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentImg}
              src={images[currentImg]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              alt="Students collaborating"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative z-10 p-12 max-w-xl text-center">
            <h1 className="text-5xl font-black mb-6 leading-tight text-white drop-shadow-lg">Join the Campus Economy.</h1>
            <p className="text-xl text-slate-100 font-medium drop-shadow-md">
              Create your unique identity, earn rewards, and connect with peers instantly securely powered by Civic.
            </p>
            <div className="mt-8 flex justify-center gap-2">
              {images.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentImg ? 'bg-white w-6' : 'bg-white/50'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
            <p className="text-slate-500 mt-2">Get started and earn 150 points instantly.</p>
          </div>

          <div className="space-y-4">
            <Input label="Full Name" name="name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} error={errors.name} />
            <Input label="Username" name="username" placeholder="johndoe123" value={formData.username} onChange={handleInputChange} error={errors.username} />
            <Input label="Email Address" name="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleInputChange} error={errors.email} />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">What is your primary goal?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, primary_intent: "buying" })}
                  className={`p-4 border rounded-xl text-left transition-all ${formData.primary_intent === "buying" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 hover:border-blue-300"}`}
                >
                  <div className="font-semibold text-slate-900">Buying</div>
                  <div className="text-xs text-slate-500 mt-1">I want to discover and buy items.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, primary_intent: "selling" })}
                  className={`p-4 border rounded-xl text-left transition-all ${formData.primary_intent === "selling" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 hover:border-blue-300"}`}
                >
                  <div className="font-semibold text-slate-900">Selling</div>
                  <div className="text-xs text-slate-500 mt-1">I want to set up a store and sell.</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Country</label>
                <select name="country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value, state: "", city: "" })} className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors">
                  <option value="">Select Country...</option>
                  {countries.map(c => (
                    <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                  ))}
                </select>
                {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">State/Region</label>
                <select name="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value, city: "" })} disabled={!formData.country} className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors disabled:opacity-50">
                  <option value="">Select State...</option>
                  {states.map(s => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">City</label>
                <select name="city" value={formData.city} onChange={handleInputChange} disabled={!formData.state} className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors disabled:opacity-50">
                  <option value="">Select City...</option>
                  {cities.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
              </div>
              <div className="space-y-1 pt-1">
                <Input label="WhatsApp / Phone" name="phone" type="tel" placeholder="+234..." value={formData.phone} onChange={handleInputChange} error={errors.phone} />
              </div>
            </div>

            <div>
              <Input label="Referral Code (Optional)" name="referralCode" placeholder="Enter 6-character code" value={referralCodeValue} maxLength={6} onChange={(e) => { setReferralCodeValue(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()); setReferralStatus("idle"); setReferralOwner(null); }} onBlur={handleReferralBlur} error={errors.referralCode} />
              {referralStatus === "checking" && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking...</p>}
              {referralStatus === "valid" && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Valid code!</p>}
              {referralStatus === "invalid" && <p className="text-xs text-red-500 mt-1">Code not found.</p>}
            </div>

            <div className="pt-4">
              {!user ? (
                <div className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center">
                  <p className="text-sm text-slate-500 mb-4 text-center">Complete registration securely with Civic</p>
                  <CivicAuthButton />
                </div>
              ) : (
                <Button onClick={submitProfile} disabled={loading} className="w-full h-12 text-lg">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Complete Registration"}
                </Button>
              )}
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account? <button onClick={() => router.push('/login')} className="text-blue-600 font-semibold hover:underline">Log in</button>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
