/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@civic/auth-web3/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";
import { Loader2, CheckCircle, User, Sparkles, Trophy, ArrowRight, Gift } from "lucide-react";
import { updateProfileSchema } from "@/lib/validators";
import CivicAuthButton from "@/components/CivicAuthButton";
import { motion, AnimatePresence } from "framer-motion";

// Type guard to check if user has a Solana wallet
function hasWallet(user: any): user is { solana: { address: string; wallet: any } } {
  return user && typeof user === 'object' && 'solana' in user && user.solana && 'address' in user.solana;
}

export default function OnboardingPage() {
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

  // Avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for wallet when user is available
  useEffect(() => {
    if (user && !isLoading) {
      if (hasWallet(user)) {
        setWalletAddress(user.solana.address);
      } else {
        const userAny = user as any;
        if (userAny.solana?.address) {
          setWalletAddress(userAny.solana.address);
        }
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && !referralCodeValue) {
      setReferralCodeValue(ref.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
    }
  }, [searchParams, referralCodeValue]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = searchParams.get("ref");
    if (ref) {
      const cleaned = ref.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (cleaned) {
        sessionStorage.setItem("referralCode", cleaned);
        if (!referralCodeValue) {
          setReferralCodeValue(cleaned);
        }
      }
    } else if (!referralCodeValue) {
      const stored = sessionStorage.getItem("referralCode");
      if (stored) {
        setReferralCodeValue(stored);
      }
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);

    const userEmail = user && "email" in user ? (user.email as string) : (formData.get("email") as string);
    const civicUserIdLocal = userAny?.id || (user && "sub" in user ? (user.sub as string) : null);
    const address = walletAddress || (civicUserIdLocal ? `civic_${civicUserIdLocal}` : null);
    if (!address) {
      toast.error("Missing account", "Please sign in again and retry");
      return;
    }

    const referralCode = String(formData.get("referralCode") || "").trim();
    const submittedName = (formData.get("name") as string) || "";
    const profileData = {
      address,
      email: userEmail,
      civic_user_id: civicUserIdLocal,
      name: submittedName,
      school: (formData.get("school") as string) || "",
      campus: (formData.get("campus") as string) || "",
      level: (formData.get("level") as string) || "",
      phone: (formData.get("phone") as string) || "",
      verified_email: true,
      ...(referralCode ? { referralCode } : {}),
    };

    const result = updateProfileSchema.safeParse(profileData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
      const formatted: { [key: string]: string } = {};
      for (const key in fieldErrors) {
        const messages = fieldErrors[key];
        if (messages && messages.length > 0) {
          formatted[key] = messages[0];
        }
      }
      setErrors(formatted);
      toast.error("Invalid profile information", "Please fix the highlighted fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        const resData = await res.json();
        // Mark the tour as seen so it doesn't fire over the celebration modal
        if (typeof window !== "undefined") {
          localStorage.setItem("studiq_welcome_tour_seen", "true");
        }
        // Show celebration screen
        setCelebrationData({
          pointsEarned: resData.pointsEarned ?? 150,
          name: submittedName.split(" ")[0] || "Student",
        });
      } else {
        const error = await res.json();
        toast.error("Failed to save profile", error.error || "Please try again");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Error", "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  // Show loading while mounting
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg mesh-bg flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center glass-panel border-white/60">
          <Loader2 className="w-12 h-12 animate-spin text-primary-blue mx-auto mb-4" />
          <p className="text-muted-text">Loading...</p>
        </Card>
      </div>
    );
  }

  // Celebration screen after successful onboarding
  if (celebrationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
            className="max-w-md w-full"
          >
            <Card className="p-8 text-center space-y-6 bg-white/95 backdrop-blur-xl border-white shadow-2xl rounded-3xl">
              {/* Animated trophy */}
              <motion.div
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex justify-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-orange-300/50">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
              </motion.div>

              {/* Welcome text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, {celebrationData.name}!
                </h1>
                <p className="text-gray-500">
                  You&apos;re officially part of StudIQ Campus!
                </p>
              </motion.div>

              {/* Points badge */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, type: "spring", bounce: 0.5 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-5"
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Gift className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Welcome Bonus</span>
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  +{celebrationData.pointsEarned}
                </div>
                <div className="text-sm text-gray-500 mt-1">StudIQ Points earned</div>
              </motion.div>

              {/* What's next */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-left space-y-2 bg-gray-50 rounded-2xl p-4"
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What you can do now</p>
                {[
                  "Browse campus stores near you",
                  "Create your own store & start selling",
                  "Earn more points with every purchase",
                  "Climb the leaderboard & win rewards",
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1 + i * 0.1 }}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="flex flex-col gap-3"
              >
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full flex items-center justify-center gap-2 py-3 text-base font-semibold"
                >
                  Go to my Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <button
                  onClick={() => router.push("/search")}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Browse stores first →
                </button>
              </motion.div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-soft-gray-bg mesh-bg flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center space-y-4 glass-panel border-white/60">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-blue to-accent-blue rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-black">Sign in to continue</h1>
          <p className="text-muted-text">Create your account to finish onboarding.</p>
          <div className="flex justify-center">
            <CivicAuthButton />
          </div>
        </Card>
      </div>
    );
  }

  // Get user email for pre-filling
  const userEmail = "email" in user ? (user.email as string) : "";

  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 glass-panel border-white/60">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-blue to-accent-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-3">
            Complete Your Profile
          </h1>
          <p className="text-muted-text">
            Welcome! Set up your account to earn{" "}
            <span className="font-semibold text-primary-blue">150 bonus points</span> instantly.
          </p>
          {walletAddress && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-2xl">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Wallet ready!</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            name="name"
            placeholder="Your full name"
            required
            error={errors.name}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="your@email.com"
            defaultValue={userEmail}
            readOnly={!!userEmail}
            className={userEmail ? "bg-gray-50" : ""}
            required={!userEmail}
            error={errors.email}
          />

          <div className="space-y-1">
            <Input
              label="School"
              name="school"
              placeholder="Your school name"
              required
              error={errors.school}
            />
            <p className="text-xs text-gray-400 pl-1">Used to connect you with sellers on your campus</p>
          </div>

          <Input
            label="Campus / Location"
            name="campus"
            placeholder="e.g. Main Campus, Yaba"
            required
            error={errors.campus}
          />

          <Input
            label="Level"
            name="level"
            placeholder="e.g. 200 Level, Graduate"
            required
            error={errors.level}
          />

          <div className="space-y-1">
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="Your phone number"
              required
              error={errors.phone}
            />
            <p className="text-xs text-gray-400 pl-1">Sellers will use this for order coordination</p>
          </div>

          <div>
            <Input
              label="Referral Code (optional)"
              name="referralCode"
              placeholder="Enter 6-character code"
              error={errors.referralCode}
              value={referralCodeValue}
              maxLength={6}
              onChange={(e) => {
                setReferralCodeValue(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
                setReferralStatus("idle");
                setReferralOwner(null);
              }}
              onBlur={handleReferralBlur}
            />
            {referralStatus === "checking" && (
              <p className="text-xs text-gray-400 pl-1 mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking code…
              </p>
            )}
            {referralStatus === "valid" && (
              <p className="text-xs text-green-600 pl-1 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Valid code{referralOwner ? ` — referred by ${referralOwner}` : ""}! You&apos;ll both earn bonus points.
              </p>
            )}
            {referralStatus === "invalid" && (
              <p className="text-xs text-red-500 pl-1 mt-1">
                Code not found. Leave blank to skip, or double-check it.
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Profile...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Complete Setup &amp; Earn 150 Points
              </span>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
