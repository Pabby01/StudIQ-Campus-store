"use client";

import { useEffect, useState } from "react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import Card from "@/components/ui/Card";
import { ShoppingBag, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

type OrderItem = {
  id: string;
  price: number;
  qty: number;
  product: {
    name: string;
    image_url: string | null;
  };
};

type Order = {
  id: string;
  created_at: string;
  status: string;
  amount: number;
  currency: string;
  items: OrderItem[];
  store: {
    name: string;
  };
};

export default function DashboardOrdersPage() {
  const auth = useWalletAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.address) {
      fetchOrders();
    } else if (!auth.loading && !auth.address) {
      setLoading(false);
    }
  }, [auth.address, auth.loading]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders/user?address=${auth.address}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <ShoppingBag className="w-6 h-6 text-primary-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">My Purchases</h1>
            <p className="text-muted-text">Track your order history and status</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-muted-text mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black mb-2">No purchases yet</h3>
                <p className="text-muted-text mb-6">Start shopping to see your orders here</p>
                <Link href="/search">
                  <Button variant="primary">Browse Products</Button>
                </Link>
              </div>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="p-0 overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-border-gray flex flex-wrap gap-4 justify-between items-center text-sm">
                  <div className="flex gap-8 text-muted-text">
                    <div>
                      <span className="block text-xs uppercase font-bold">Order Placed</span>
                      <span className="text-black font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold">Total</span>
                      <span className="text-black font-medium">
                        {order.currency === 'SOL' ? 'SOL' : '$'}{order.amount.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold">Sold By</span>
                      <span className="text-primary-blue font-medium">{order.store?.name || "Unknown Store"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${order.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                      {order.status}
                    </span>
                    <Link href={`/checkout/success/${order.id}`}>
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        View Receipt
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-6">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-start">
                        {item.product.image_url ? (
                          <img src={item.product.image_url} alt={item.product.name} className="w-20 h-20 object-cover rounded-md border border-border-gray" />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-black">{item.product.name}</h4>
                          <p className="text-sm text-muted-text">Qty: {item.qty}</p>
                          <p className="text-sm font-medium text-primary-blue mt-1">
                            {order.currency === 'SOL' ? 'SOL' : '$'}{item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          {/* Action buttons could go here (Review, Buy Again) */}
                          <Link href={`/product/${item.product.name}`}> {/* Ideally product ID, but name link works for now or just generic */}
                            {/*  <Button variant="ghost" size="sm" className="text-primary-blue hover:text-blue-700">
                                            Buy it again
                                        </Button> */}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
