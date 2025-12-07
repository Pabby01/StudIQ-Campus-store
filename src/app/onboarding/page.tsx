"use client";

import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useRouter } from "next/navigation";

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
    const res = await fetch("/api/profile/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) router.push("/dashboard");
  }
  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Onboarding</h1>
      <form action={onSubmit} className="space-y-3">
        <input name="name" className="w-full rounded-md border p-2" placeholder="Full name" />
        <input name="school" className="w-full rounded-md border p-2" placeholder="School" />
        <input name="campus" className="w-full rounded-md border p-2" placeholder="Campus" />
        <input name="level" className="w-full rounded-md border p-2" placeholder="Level" />
        <input name="phone" className="w-full rounded-md border p-2" placeholder="Phone" />
        <button className="w-full rounded-md bg-black p-2 text-white" type="submit">Save</button>
      </form>
    </div>
  );
}

