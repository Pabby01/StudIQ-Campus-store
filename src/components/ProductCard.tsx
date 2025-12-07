import Link from "next/link";
import { Star } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

type Product = Readonly<{
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  rating?: number | null;
  category?: string;
}>;

export default function ProductCard({ p }: { p: Product }) {
  return (
    <div className="bg-white rounded-xl border border-border-gray shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Product Image */}
      <div className="relative aspect-square bg-soft-gray-bg overflow-hidden">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-text text-sm">No image</span>
          </div>
        )}
        {p.category && (
          <div className="absolute top-3 left-3">
            <Badge variant="blue">{p.category}</Badge>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-black text-base line-clamp-2 mb-1">
            {p.name}
          </h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-muted-text">
              {p.rating?.toFixed?.(1) ?? "0.0"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary-blue">
            ${Number(p.price).toFixed(2)}
          </div>
          <Link href={`/product/${p.id}`}>
            <Button variant="primary" size="sm">
              View
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
