import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

type Store = Readonly<{
  id: string;
  name: string;
  category: string;
  description?: string | null;
  banner_url?: string | null;
  rating?: number | null;
}>;

export default function StoreCard({ s }: { s: Store }) {
  return (
    <div className="bg-white rounded-xl border border-border-gray shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Store Banner */}
      <div className="relative h-40 bg-gradient-to-br from-primary-blue to-accent-blue overflow-hidden">
        {s.banner_url ? (
          <img
            src={s.banner_url}
            alt={s.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white text-lg font-semibold">{s.name.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Store Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-black text-lg mb-1">{s.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="gray">{s.category}</Badge>
          </div>
          {s.description && (
            <p className="text-sm text-muted-text line-clamp-2">{s.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-gray">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-black">
              {s.rating?.toFixed?.(1) ?? "4.5"}
            </span>
          </div>
          <Link href={`/store/${s.id}`}>
            <Button variant="primary" size="sm">
              Visit Store
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
