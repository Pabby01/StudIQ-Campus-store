"use client";

import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { UserCircle } from "lucide-react";

export default function OnboardingPage() {
  const auth = useWalletAuth();
  const router = useRouter();

  async function onSubmit(form: FormData) {
    const payload = Object.fromEntries(form.entries());
    const body = {
      address: auth.address,
      name: String(payload.name),
      school: String(payload.school),
      campus: String(payload.campus),
      level: String(payload.level),
      phone: String(payload.phone),
    };
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle className="w-8 h-8 text-primary-blue" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">Complete Your Profile</h1>
          <p className="text-muted-text">Tell us a bit about yourself to get started</p>
        </div>

        <form action={onSubmit} className="space-y-4">
          <Input name="name" label="Full Name" placeholder="John Doe" required />
          <Input name="school" label="School" placeholder="University of Example" required />
          <Input name="campus" label="Campus" placeholder="Main Campus" required />
          <Input name="level" label="Level" placeholder="Undergraduate" required />
          <Input name="phone" label="Phone Number" placeholder="+1234567890" required />

          <Button type="submit" variant="primary" className="w-full mt-6">
            Complete Setup
          </Button>
        </form>
      </Card>
    </div>
  );
}
