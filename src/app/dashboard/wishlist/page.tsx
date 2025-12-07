import Card from "@/components/ui/Card";
import { Heart } from "lucide-react";

export default function DashboardWishlistPage() {
  return (
    <div className="min-h-screen bg-soft-gray-bg p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Heart className="w-6 h-6 text-primary-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Wishlist</h1>
            <p className="text-muted-text">Your saved products</p>
          </div>
        </div>

        {/* Wishlist */}
        <Card>
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-text mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No items in wishlist</h3>
            <p className="text-muted-text">Save products you like to view them later</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
