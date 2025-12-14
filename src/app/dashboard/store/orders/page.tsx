"use client";

import { useState } from "react";
import useSWR from "swr";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Package, Loader2, MapPin, Mail, User, Phone, Calendar, CreditCard, Truck, Check } from "lucide-react";
import Link from "next/link";

type OrderItem = {
  id: string;
  price: number;
  qty: number;
  product: {
    name: string;
    image_url?: string | null;
  };
};

type EnhancedOrder = {
  id: string;
  created_at: string;
  status: string;
  amount: number;
  currency: string;
  payment_method: string;
  delivery_method: string;
  buyer_email: string;
  delivery_info: {
    name: string;
    email?: string;
    address?: string;
    city?: string;
    zip?: string;
  };
  items: OrderItem[];
};

export default function VendorOrdersPage() {
  const auth = useWalletAuth();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { data, mutate, error, isLoading } = useSWR<EnhancedOrder[]>(
    auth.address ? `/api/vendor/orders?address=${auth.address}` : null,
    async (url: string) => (await fetch(url)).json()
  );

  async function update(id: string, status: string) {
    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, status, address: auth.address }),
      });

      if (res.ok) {
        mutate();
      } else {
        console.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "shipped":
      case "out_for_delivery":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "processing":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gray-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl shadow-md">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Store Orders</h1>
            <p className="text-muted-text">Manage and fulfill your customer orders</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {!data || data.length === 0 ? (
            <Card className="text-center py-16">
              <Package className="w-16 h-16 text-muted-text mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No orders yet</h3>
              <p className="text-muted-text">Orders will appear here when customers make purchases</p>
            </Card>
          ) : (
            data.map((order) => {
              const isExpanded = expandedOrder === order.id;

              return (
                <Card key={order.id} className="overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-border-gray">
                    <div className="flex flex-wrap gap-4 justify-between items-center">
                      <div className="flex gap-6">
                        <div>
                          <span className="text-xs text-muted-text uppercase font-bold tracking-wide">Order ID</span>
                          <p className="font-mono font-bold text-black">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-text uppercase font-bold tracking-wide">Date</span>
                          <p className="text-sm font-medium text-black">
                            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-text uppercase font-bold tracking-wide">Total</span>
                          <p className="text-sm font-bold text-primary-blue">
                            {order.currency === 'SOL' ? `${order.amount.toFixed(2)} SOL` : `$${order.amount.toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-xs font-bold capitalize border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="text-sm text-primary-blue hover:underline font-medium"
                        >
                          {isExpanded ? "Hide Details" : "View Details"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Details (Expanded) */}
                  {isExpanded && (
                    <div className="p-6 space-y-6">
                      {/* Customer & Delivery Info */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Customer Information
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <User className="w-4 h-4 text-gray-500 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500">Name</p>
                                <p className="font-medium text-black">{order.delivery_info?.name || "N/A"}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Mail className="w-4 h-4 text-gray-500 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-medium text-black">{order.buyer_email || "N/A"}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Delivery Information
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Package className="w-4 h-4 text-gray-500 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500">Method</p>
                                <p className="font-medium text-black capitalize">{order.delivery_method || "N/A"}</p>
                              </div>
                            </div>
                            {order.delivery_method === 'shipping' && order.delivery_info?.address && (
                              <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                                <div>
                                  <p className="text-xs text-gray-500">Address</p>
                                  <p className="font-medium text-black">
                                    {order.delivery_info.address}<br />
                                    {order.delivery_info.city}, {order.delivery_info.zip}
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="flex items-start gap-3">
                              <CreditCard className="w-4 h-4 text-gray-500 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500">Payment</p>
                                <p className="font-medium text-black capitalize">
                                  {order.payment_method === 'solana' ? 'Crypto (SOL)' : 'Cash on Delivery'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Order Items</h3>
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Product</th>
                                <th className="text-center px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Qty</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Price</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {order.items?.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {item.product.image_url ? (
                                        <img src={item.product.image_url} alt={item.product.name} className="w-12 h-12 object-cover rounded-md border border-gray-200" />
                                      ) : (
                                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                                          <Package className="w-6 h-6 text-gray-400" />
                                        </div>
                                      )}
                                      <span className="font-medium text-black">{item.product.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center font-semibold text-black">{item.qty}</td>
                                  <td className="px-4 py-3 text-right text-gray-600">
                                    {order.currency === 'SOL' ? `${item.price.toFixed(2)} SOL` : `$${item.price.toFixed(2)}`}
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-black">
                                    {order.currency === 'SOL' ? `${(item.price * item.qty).toFixed(2)} SOL` : `$${(item.price * item.qty).toFixed(2)}`}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                        {order.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => update(order.id, "processing")}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Start Processing
                          </Button>
                        )}
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => update(order.id, "shipped")}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Mark Shipped
                          </Button>
                        )}
                        {order.status === 'shipped' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => update(order.id, "completed")}
                            className="border-green-200 text-green-600 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark Completed
                          </Button>
                        )}
                        <Link href={`/checkout/success/${order.id}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            View Receipt
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
