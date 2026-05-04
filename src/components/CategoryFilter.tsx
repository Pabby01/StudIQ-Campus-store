"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FILTER_CATEGORIES } from "@/lib/categories";
import { motion } from "framer-motion";

interface CategoryFilterProps {
  selected?: string;
  onChange?: (category: string) => void;
}

const tones = [
  "from-fuchsia-500 to-pink-500",
  "from-sky-500 to-blue-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-indigo-500",
  "from-slate-900 to-slate-700",
];

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams?.get("category") || "All";

  const currentCategory = selected !== undefined ? selected : urlCategory;

  const handleCategoryClick = (category: string) => {
    if (onChange) {
      onChange(category);
    } else {
      const params = new URLSearchParams(searchParams?.toString());
      if (category === "All") {
        params.delete("category");
      } else {
        params.set("category", category);
      }
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
        {FILTER_CATEGORIES.map((category, index) => {
          const isActive = currentCategory === category || (currentCategory === "" && category === "All");
          const tone = tones[index % tones.length];
          return (
            <motion.button
              key={category}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -1 }}
              onClick={() => handleCategoryClick(category)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${isActive
                ? `bg-gradient-to-r ${tone} text-white shadow-md`
                : "glass-pill text-muted-text hover:text-primary-blue"
                }`}
            >
              {category}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
