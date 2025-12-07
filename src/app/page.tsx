import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Campus Store</h1>
        <p className="text-sm text-zinc-600">Discover nearby stores, earn rewards, and pay with Solana.</p>
      </header>
      <nav className="mt-6 flex gap-3">
        <Link className="rounded-md border px-3 py-1" href="/stores">Stores</Link>
        <Link className="rounded-md border px-3 py-1" href="/cart">Cart</Link>
        <Link className="rounded-md border px-3 py-1" href="/profile">Profile</Link>
      </nav>
      <section className="mt-8 space-y-2">
        <h2 className="text-xl font-semibold">Welcome</h2>
        <p className="text-sm text-zinc-600">Start by connecting a wallet on the Stores page.</p>
      </section>
    </div>
  );
}
