"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@civic/auth-web3/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";
import { Loader2, CheckCircle, Wallet } from "lucide-react";

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
  const [walletCreated, setWalletCreated] = useState(false);
  const [creatingWallet, setCreatingWallet] = useState(false);

  // Auto-create wallet if user doesn't have one
  useEffect(() => {
    if (user && !isLoading) {
      // Check if user already has an embedded wallet
      if (hasWallet(user)) {
        // User already has an embedded wallet
        setWalletAddress(user.solana.address);
        setWalletCreated(true);
        console.log("[Onboarding] User has wallet:", user.solana.address);
      } else {
        // For Civic embedded wallets, the wallet should be created automatically
        // If not, we'll try to create it via the user context
        console.log("[Onboarding] Checking for wallet creation...");
        setCreatingWallet(true);

        // Check if createWallet method exists
        const userContext = user as any;
        if (userContext.createWallet && typeof userContext.createWallet === 'function') {
          userContext.createWallet()
            .then(() => {
              console.log("[Onboarding] Wallet created successfully!");
              setWalletCreated(true);
              setCreatingWallet(false);

              // Get the wallet address after creation
              setTimeout(() => {
                if (hasWallet(user)) {
                  setWalletAddress(user.solana.address);
                }
              }, 1000);
            })
            .catch((error: Error) => {
              console.error("[Onboarding] Wallet creation failed:", error);
              setCreatingWallet(false);
              toast.error("Wallet Creation Failed", "Please try signing in again or contact support");
            });
        } else {
          // Wallet should be created automatically by Civic
          // Poll to check if wallet appears
          const checkWallet = setInterval(() => {
            if (hasWallet(user)) {
              setWalletAddress(user.solana.address);
              setWalletCreated(true);
              setCreatingWallet(false);
              clearInterval(checkWallet);
            }
          }, 1000);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkWallet);
            if (!hasWallet(user)) {
              setCreatingWallet(false);
              toast.error("Wallet Setup Issue", "Please refresh the page or contact support");
            }
          }, 10000);
        }
      }
    }
  }, [user, isLoading, toast]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!walletAddress) {
      toast.error("Wallet not ready", "Please wait while we create your wallet");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    // Get email from Civic user object
    const userEmail = user && 'email' in user ? (user.email as string) : formData.get("email") as string;
    const civicUserId = user && 'sub' in user ? (user.sub as string) : null;

    const profileData = {
      address: walletAddress,
      email: userEmail,
      civic_user_id: civicUserId,
      name: formData.get("name") as string,
      school: formData.get("school") as string,
      campus: formData.get("campus") as string,
      level: formData.get("level") as string,
      phone: formData.get("phone") as string,
      verified_email: true, // Civic verifies emails
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

  // Show loading while Civic auth initializes
  if (isLoading) {
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
    router.push("/");
    return null;
  }

  // Show wallet creation status
  if (creatingWallet || (!walletCreated && !walletAddress)) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-blue to-accent-blue rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-3">
              Creating Your Wallet
            </h2>
            <p className="text-muted-text mb-4">
              Setting up your secure Solana wallet... This will only take a moment
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-primary-blue">
              <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Get email from user object
  const userEmail = user && 'email' in user ? user.email as string : "";
  const userName = user && 'name' in user ? user.name as string : "";

  return (
    <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">
            Complete Your Profile
          </h1>
          <p className="text-muted-text mb-3">
            Tell us a bit about yourself to get started
          </p>
          {walletAddress && (
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <Wallet className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-700 font-medium">
                Wallet Ready: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="email"
            label="Email"
            type="email"
            defaultValue={userEmail}
            placeholder="your-email@university.edu"
            required
            disabled={!!userEmail}
            className={userEmail ? "bg-gray-50" : ""}
          />

          <Input
            name="name"
            label="Full Name"
            defaultValue={userName}
            placeholder="John Doe"
            required
          />

          <Input
            name="school"
            label="University/School"
            placeholder="University of Example"
            required
          />

          <Input
            name="campus"
            label="Campus"
            placeholder="Main Campus"
            required
          />

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Level <span className="text-red-600">*</span>
            </label>
            <select
              name="level"
              required
              className="w-full px-4 py-2 bg-white border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">Select your level</option>
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Graduate">Graduate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <Input
            name="phone"
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 123-4567"
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-6"
            disabled={loading || !walletAddress}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Profile...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-text mt-6">
          Your wallet is secure and non-custodial. Only you have access to your funds.
        </p>
      </Card>
    </div>
  );
}
