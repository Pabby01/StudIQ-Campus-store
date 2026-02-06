/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@civic/auth-web3/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";
import { Loader2, CheckCircle, User } from "lucide-react";
import { updateProfileSchema } from "@/lib/validators";
import CivicAuthButton from "@/components/CivicAuthButton";

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
        // Try to get wallet address from user context
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);

    const userEmail = user && "email" in user ? (user.email as string) : (formData.get("email") as string);
    const civicUserId = userAny?.id || (user && "sub" in user ? (user.sub as string) : null);
    const address = walletAddress || (civicUserId ? `civic_${civicUserId}` : null);
    if (!address) {
      toast.error("Missing account", "Please sign in again and retry");
      return;
    }

    const referralCode = String(formData.get("referralCode") || "").trim();
    const profileData = {
      address,
      email: userEmail,
      civic_user_id: civicUserId,
      name: (formData.get("name") as string) || "",
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
        toast.success("Welcome to StudIQ!", "Your profile has been created");
        router.push("/");
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
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-blue mx-auto mb-4" />
          <p className="text-muted-text">Loading...</p>
        </Card>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
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
    <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-blue to-accent-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-3">
            Complete Your Profile
          </h1>
          <p className="text-muted-text">
            Welcome! Let&apos;s set up your StudIQ account.
          </p>
          {walletAddress && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
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

          <Input
            label="School"
            name="school"
            placeholder="Your school name"
            required
            error={errors.school}
          />

          <Input
            label="Campus"
            name="campus"
            placeholder="Campus location"
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

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="Your phone number"
            required
            error={errors.phone}
          />
          <Input
            label="Referral Code (optional)"
            name="referralCode"
            placeholder="Enter referral code"
            error={errors.referralCode}
            value={referralCodeValue}
            maxLength={6}
            onChange={(e) => setReferralCodeValue(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-6"
          >
            {loading ? "Creating Profile..." : "Complete Setup"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
