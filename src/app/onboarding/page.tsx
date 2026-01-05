"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@civic/auth-web3/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";
import { Loader2, CheckCircle, User } from "lucide-react";

// Type guard to check if user has a Solana wallet
function hasWallet(user: any): user is { solana: { address: string; wallet: any } } {
  return user && typeof user === 'object' && 'solana' in user && user.solana && 'address' in user.solana;
}

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for wallet when user is available
  useEffect(() => {
    if (user && !isLoading) {
      if (hasWallet(user)) {
        setWalletAddress(user.solana.address);
        console.log("[Onboarding] User has wallet:", user.solana.address);
      } else {
        // Try to get wallet address from user context
        const userAny = user as any;
        if (userAny.solana?.address) {
          setWalletAddress(userAny.solana.address);
        }
      }
    }
  }, [user, isLoading]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Get email from Civic user object
    const userEmail = user && 'email' in user ? (user.email as string) : formData.get("email") as string;
    const civicUserId = user && 'sub' in user ? (user.sub as string) : null;

    // Use wallet address if available, otherwise generate a placeholder
    const address = walletAddress || `civic_${civicUserId || Date.now()}`;

    const profileData = {
      address,
      email: userEmail,
      civic_user_id: civicUserId,
      name: formData.get("name") as string,
      school: formData.get("school") as string,
      campus: formData.get("campus") as string,
      level: formData.get("level") as string,
      phone: formData.get("phone") as string,
      verified_email: true,
    };

    console.log("[Onboarding] Submitting profile:", profileData);

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        console.log("[Onboarding] Profile created successfully");
        toast.success("Welcome to StudIQ!", "Your profile has been created");
        router.push("/");
      } else {
        const error = await res.json();
        console.error("[Onboarding] Profile creation failed:", error);
        toast.error("Failed to save profile", error.error || "Please try again");
      }
    } catch (error) {
      console.error("[Onboarding] Profile creation error:", error);
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
    if (typeof window !== 'undefined') {
      router.push("/");
    }
    return null;
  }

  // Get user email for pre-filling
  const userEmail = 'email' in user ? (user.email as string) : '';

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
          />

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="your@email.com"
            defaultValue={userEmail}
            readOnly={!!userEmail}
            className={userEmail ? "bg-gray-50" : ""}
          />

          <Input
            label="School"
            name="school"
            placeholder="Your school name"
            required
          />

          <Input
            label="Campus"
            name="campus"
            placeholder="Campus location"
            required
          />

          <Input
            label="Level"
            name="level"
            placeholder="e.g. 200 Level, Graduate"
          />

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="Your phone number"
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
