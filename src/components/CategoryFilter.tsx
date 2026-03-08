"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { FILTER_CATEGORIES } from "@/lib/categories";

interface CategoryFilterProps {
  selected?: string;
  onChange?: (category: string) => void;
}

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
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {FILTER_CATEGORIES.map((category) => {
        const isActive = currentCategory === category || (currentCategory === "" && category === "All");
        return (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${isActive
              ? "bg-primary-blue text-white shadow-sm"
              : "glass-pill text-muted-text hover:text-primary-blue"
              }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
