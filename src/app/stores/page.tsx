import WalletBar from "@/components/WalletBar";

type StoreCard = Readonly<{
  id: string;
  name: string;
  category: string;
  location: string;
  hours: string;
  rating: number;
  cashbackLabel: string;
}>;

const stores: StoreCard[] = [
  {
    id: "cafeteria",
    name: "FUNAAB Cafeteria",
    category: "Food & Dining",
    location: "Main Campus Building A",
    hours: "7:00 AM - 9:00 PM",
    rating: 4.5,
    cashbackLabel: "5% back",
  },
  {
    id: "mart",
    name: "Campus Mart",
    category: "Groceries",
    location: "Student Center Ground Floor",
    hours: "8:00 AM - 10:00 PM",
    rating: 4.2,
    cashbackLabel: "₦200 per ₦1000",
  },
  {
    id: "bookhub",
    name: "BookHub",
    category: "Academic",
    location: "Library Complex",
    hours: "9:00 AM - 6:00 PM",
    rating: 4.7,
    cashbackLabel: "8% back",
  },
];

export default function StoresPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">Campus Store</h1>
        <p className="text-sm text-zinc-600">
          Earn cashback and rewards at campus stores. Browse by category and pay with your wallet.
        </p>
      </header>
      <WalletBar />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => (
          <div key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{s.name}</div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{s.cashbackLabel}</span>
            </div>
            <div className="mt-2 text-sm text-zinc-600">{s.category}</div>
            <div className="mt-1 text-xs text-zinc-500">{s.location}</div>
            <div className="mt-1 text-xs text-zinc-500">{s.hours}</div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm">⭐ {s.rating.toFixed(1)}</div>
              <button className="rounded-md border px-3 py-1 text-sm">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

