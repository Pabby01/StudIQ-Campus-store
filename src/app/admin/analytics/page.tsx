"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to overview page
    router.push("/admin/analytics/overview");
  }, [router]);

  return null;
}
