"use client";

export default function LoadingSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(count)].map((_, i) => (
                <div
                    key={i}
                    className="bg-white rounded-xl border border-border-gray overflow-hidden animate-pulse"
                >
                    {/* Image skeleton */}
                    <div className="aspect-square bg-gray-200" />

                    {/* Content skeleton */}
                    <div className="p-4 space-y-3">
                        {/* Category badge */}
                        <div className="h-5 w-20 bg-gray-200 rounded-full" />

                        {/* Title */}
                        <div className="h-6 bg-gray-200 rounded" />
                        <div className="h-6 w-3/4 bg-gray-200 rounded" />

                        {/* Price */}
                        <div className="h-8 w-24 bg-gray-200 rounded" />

                        {/* Button */}
                        <div className="h-10 bg-gray-200 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}
