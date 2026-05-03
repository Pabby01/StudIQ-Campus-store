import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";

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
    <motion.div
      className="glass-card rounded-2xl border border-white/60 hover-lift overflow-hidden group"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Store Banner */}
      <div className="relative h-28 sm:h-36 bg-gradient-to-br from-primary-blue to-accent-blue overflow-hidden">
        {s.banner_url ? (
          <img
            src={s.banner_url}
            alt={s.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white text-lg font-semibold">{s.name.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Store Info */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-semibold text-black text-base mb-1 truncate">{s.name}</h3>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gray" className="text-[10px] px-1.5 py-0.5">{s.category}</Badge>
          </div>
          {s.description && (
            <p className="text-xs text-muted-text line-clamp-2">{s.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/60">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-black">
              {s.rating?.toFixed?.(1) ?? "4.5"}
            </span>
          </div>
          <Link href={`/store/${s.id}`}>
            <Button variant="primary" size="sm" className="text-[10px] h-7 px-3">
              Visit Store
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
