import Link from "next/link";

export default function DashboardSidebar() {
  return (
    <div className="flex w-56 flex-col gap-2 border-r p-4 text-sm">
      <Link href="/dashboard">Overview</Link>
      <Link href="/dashboard/store">My Store</Link>
      <Link href="/dashboard/products">Products</Link>
      <Link href="/dashboard/orders">Orders</Link>
      <Link href="/dashboard/settings">Settings</Link>
    </div>
  );
}

