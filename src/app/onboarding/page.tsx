"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const wallet = useWallet();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const address = wallet.connected && wallet.publicKey ? wallet.publicKey.toString() : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!address) {
      toast.error("Wallet not connected", "Please connect your wallet first");
      router.push("/connect");
      return;
    }

    console.log("[Onboarding] Starting profile creation for:", address);
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const profileData = {
      address,
      name: formData.get("name"),
      email: formData.get("email"),
      school: formData.get("school"),
      campus: formData.get("campus"),
      level: formData.get("level"),
      phone: formData.get("phone"),
    };

    console.log("[Onboarding] Profile data:", profileData);

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      console.log("[Onboarding] Profile update response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("[Onboarding] Profile created successfully:", data);
        toast.success("Welcome!", "Your profile has been created");
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

  if (!address) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="text-muted-text mb-4">Please connect your wallet first</p>
          <Button variant="primary" onClick={() => router.push("/connect")}>
            Connect Wallet
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black mb-2">Complete Your Profile</h1>
          <p className="text-muted-text">Tell us a bit about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="name"
            label="Full Name"
            placeholder="John Doe"
            required
          />
          <Input
            name="email"
            label="Email"
            type="email"
            placeholder="john@university.edu"
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
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
