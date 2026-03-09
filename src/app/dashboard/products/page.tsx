"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import ProductCard from "@/components/ProductCard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Plus, Package, Loader2 } from "lucide-react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { useToast } from "@/hooks/useToast";
import { motion } from "framer-motion";

type Store = {
  id: string;
  name: string;
};

type StoreWithOwner = Store & {
  owner_address?: string | null;
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
  const { walletAddress, isAuthenticated, isLoading: authLoading } = useCivicWallet();
  const toast = useToast();
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Computed products for current page
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (walletAddress) {
      fetchStores();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  const fetchStores = async () => {
    try {
      const address = walletAddress || "";
      const res = await fetch("/api/store/all?limit=100");
      const data = await res.json();

      // Filter for my stores
      const myStores = (data.stores as StoreWithOwner[]).filter((s) => s.owner_address === address);
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
      setCurrentPage(1); // Reset to first page
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
    } catch {
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
    } catch {
      toast.error("Error deleting product");
    }
  };

  if (!isAuthenticated || authLoading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 py-6 flex items-center justify-center">
        <Card className="p-8 text-center border-white/60">
          <h2 className="text-xl font-bold mb-4">Sign In Required</h2>
          <p className="text-muted-text">Please sign in to manage products.</p>
        </Card>
      </div>
    );
  }

  const sellerAddress = walletAddress || "";

  return (
    <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 py-6 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="glass-panel rounded-3xl p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/80 rounded-2xl border border-white/70">
              <Package className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-black truncate">Products</h1>
              <p className="text-sm text-muted-text">
                {stores.length > 0
                  ? `Managing ${stores.find(s => s.id === selectedStoreId)?.name || 'Store'} Inventory`
                  : "Manage your product inventory"}
              </p>
            </div>
          </div>

          {stores.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              {stores.length > 1 && (
                <select
                  className="px-4 py-2 rounded-2xl border border-white/70 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
        </motion.div>

        {/* Product Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="glass-panel rounded-3xl p-5 sm:p-6"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-black">Add New Product</h2>
            {selectedStoreId ? (
              <ProductForm storeId={selectedStoreId} onSuccess={() => {
                setShowForm(false);
                fetchProducts(selectedStoreId);
              }} />
            ) : (
              <p className="text-sm text-muted-text">Select a store first.</p>
            )}
          </motion.div>
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
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
            >
              {paginatedProducts.map(product => {
                // Pass seller's address so ProductCard knows these are their own products
                const productWithOwner = {
                  ...product,
                  owner_address: sellerAddress
                };

                return (
                  <ProductCard
                    key={product.id}
                    p={productWithOwner}
                    onEdit={() => router.push(`/dashboard/products/edit/${product.id}`)}
                    onDelete={() => handleDeleteProduct(product.id)}
                  />
                );
              })}
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2"
                >
                  Previous
                </Button>
                <span className="text-sm font-medium text-slate-600 px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
