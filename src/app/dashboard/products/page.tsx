"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import ProductCard from "@/components/ProductCard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Plus, Package, Loader2, Edit } from "lucide-react";
import { useWallet } from "@solana/react-hooks";
import { useToast } from "@/hooks/useToast";

type Store = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
  inventory: number;
  store_id: string;
};

export default function DashboardProductsPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const wallet = useWallet();
  const toast = useToast();

  useEffect(() => {
    if (wallet.status === "connected" && wallet.session.account.address) {
      fetchStores();
    }
  }, [wallet.status]);

  const fetchStores = async () => {
    try {
      const address = wallet.status === "connected" ? wallet.session.account.address.toString() : "";
      const res = await fetch("/api/store/all?limit=100");
      const data = await res.json();

      // Filter for my stores
      const myStores = data.stores.filter((s: any) => s.owner_address === address);
      setStores(myStores);

      if (myStores.length > 0) {
        setSelectedStoreId(myStores[0].id);
        fetchProducts(myStores[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch stores", error);
      setLoading(false);
    }
  };

  const fetchProducts = async (storeId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/product/search?storeId=${storeId}&limit=100`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm("Are you sure you want to delete this store? All products will be deleted.")) return;
    try {
      const res = await fetch(`/api/store/${storeId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Store deleted");
        fetchStores();
        if (selectedStoreId === storeId) setSelectedStoreId(null);
      } else {
        toast.error("Failed to delete store");
      }
    } catch (e) {
      toast.error("Error deleting store");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/product/${productId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted");
        if (selectedStoreId) fetchProducts(selectedStoreId);
      } else {
        toast.error("Failed to delete product");
      }
    } catch (e) {
      toast.error("Error deleting product");
    }
  };

  if (wallet.status !== "connected") {
    return (
      <div className="min-h-screen bg-soft-gray-bg p-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-muted-text">Please connect your wallet to manage products.</p>
        </Card>
      </div>
    );
  }

  const sellerAddress = wallet.status === "connected" ? wallet.session.account.address.toString() : "";

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
              <p className="text-muted-text">
                {stores.length > 0
                  ? `Managing ${stores.find(s => s.id === selectedStoreId)?.name || 'Store'} Inventory`
                  : "Manage your product inventory"}
              </p>
            </div>
          </div>

          {stores.length > 0 && (
            <div className="flex gap-2">
              {stores.length > 1 && (
                <select
                  className="px-4 py-2 rounded-lg border border-border-gray"
                  value={selectedStoreId || ""}
                  onChange={(e) => {
                    setSelectedStoreId(e.target.value);
                    fetchProducts(e.target.value);
                  }}
                >
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
              {selectedStoreId && (
                <Button variant="danger" onClick={() => handleDeleteStore(selectedStoreId)}>
                  Delete Store
                </Button>
              )}
              <Button variant="primary" onClick={() => setShowForm(!showForm)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          )}
        </div>

        {/* Product Form */}
        {showForm && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
            {selectedStoreId ? (
              <ProductForm storeId={selectedStoreId} onSuccess={() => {
                setShowForm(false);
                fetchProducts(selectedStoreId);
              }} />
            ) : (
              <p>Select a store first.</p>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-blue" />
          </div>
        ) : stores.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-text mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No Store Found</h3>
              <p className="text-muted-text mb-6">You need to create a store before adding products.</p>
              <Button variant="primary" onClick={() => window.location.href = "/store/create"}>
                Create Your First Store
              </Button>
            </div>
          </Card>
        ) : products.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-text mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No products yet</h3>
              <p className="text-muted-text mb-6">Start by adding your first product to {stores.find(s => s.id === selectedStoreId)?.name}</p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => {
              // Pass seller's address so ProductCard knows these are their own products
              const productWithOwner = {
                ...product,
                owner_address: sellerAddress
              };

              return (
                <div key={product.id} className="relative group">
                  <ProductCard p={productWithOwner} />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-20">
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.preventDefault();
                      router.push(`/dashboard/products/edit/${product.id}`);
                    }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="danger" size="sm" onClick={(e) => {
                      e.preventDefault();
                      handleDeleteProduct(product.id);
                    }}>
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
