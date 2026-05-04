import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { RecentlyViewedProduct } from '@/hooks/useRecentlyViewed';

interface RecentlyViewedCarouselProps {
  products: RecentlyViewedProduct[];
  isLoading?: boolean;
}

export const RecentlyViewedCarousel: React.FC<RecentlyViewedCarouselProps> = ({
  products,
  isLoading,
}) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-purple-50 to-pink-50 py-8 px-4 rounded-lg border border-purple-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-purple-600">🕐</span> Recently Viewed
          </h2>
          <Link
            href="/dashboard/orders"
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium"
          >
            View History <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.slice(0, 5).map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group cursor-pointer"
            >
              <div className="relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
                {/* Image Container */}
                <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                  {product.image_url && (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-sm font-bold text-purple-600">
                      ₦{product.priceNgn.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Quick View Badge */}
                <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  View
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
