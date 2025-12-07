"use client";

import { useState } from "react";
import ProductForm from "@/components/ProductForm";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Package, Plus } from "lucide-react";

export default function DashboardProductsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-soft-gray-bg p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-primary-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">Products</h1>
              <p className="text-muted-text">Manage your product inventory</p>
            </div>
          </div>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Product Form */}
        {showForm && (
          <ProductForm onSuccess={() => setShowForm(false)} />
        )}

        {/* Products List */}
        <Card>
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-text mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No products yet</h3>
            <p className="text-muted-text mb-6">Start by adding your first product</p>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
