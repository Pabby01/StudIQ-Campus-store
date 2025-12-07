"use client";

import { useState } from "react";
import { signupSchema, signinSchema } from "@/lib/validators";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(form: FormData) {
    setError(null);
    const payload = Object.fromEntries(form.entries());
    const result = (mode === "signin" ? signinSchema : signupSchema).safeParse(payload);
    if (!result.success) {
      setError("Invalid form input");
      return;
    }
    // TODO: wire to NextAuth or custom API
    alert(`${mode} submitted`);
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">{mode === "signin" ? "Sign In" : "Sign Up"}</h1>
      <form action={handleSubmit} className="space-y-3">
        <input name="email" type="email" placeholder="University email" className="w-full rounded-md border p-2" />
        {mode === "signup" && (
          <input name="university" type="text" placeholder="University" className="w-full rounded-md border p-2" />
        )}
        <input name="password" type="password" placeholder="Password" className="w-full rounded-md border p-2" />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="w-full rounded-md bg-black p-2 text-white" type="submit">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>
      <button className="text-sm text-zinc-600" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>Switch to {mode === "signin" ? "Sign Up" : "Sign In"}</button>
    </div>
  );
}

