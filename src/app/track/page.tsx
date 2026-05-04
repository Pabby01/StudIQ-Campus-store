/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { Search, Package, Truck, CheckCircle, Clock, XCircle, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

type OrderDetails = {
    id: string;
    created_at: string;
    status: string;
    amount: number;
    currency: string;
    payment_method: string;
    delivery_method: string;
    delivery_info?: {
        name?: string;
        address?: string;
        city?: string;
        zip?: string;
    };
    items: {
        id: string;
        price: number;
        qty: number;
        product: {
            name: string;
            image_url?: string | null;
        };
    }[];
    store: {
        name: string;
    };
};

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState("");
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const trackOrder = async () => {
        if (!orderId.trim()) {
            setError("Please enter an order ID");
            return;
        }

        setLoading(true);
        setError(null);
        setOrder(null);

        try {
            const res = await fetch(`/api/track/${orderId.trim()}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data.order);
            } else {
                setError("Order not found. Please check your Order ID and try again.");
            }
        } catch (err) {
            setError("Failed to track order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (status: string) => {
        const steps = ['pending', 'processing', 'shipped', 'completed'];
        return steps.indexOf(status) + 1;
    };

    const StatusTimeline = ({ status }: { status: string }) => {
        const currentStep = getStatusStep(status);

        const steps = [
            { number: 1, label: "Order Placed", icon: Package, status: "pending" },
            { number: 2, label: "Processing", icon: Clock, status: "processing" },
            { number: 3, label: "Shipped", icon: Truck, status: "shipped" },
            { number: 4, label: "Delivered", icon: CheckCircle, status: "completed" }
        ];

        return (
            <div className="relative">
                <div className="flex justify-between items-start">
                    {steps.map((step, index) => {
                        const isCompleted = step.number <= currentStep;
                        const isCurrent = step.number === currentStep;
                        const Icon = step.icon;

                        return (
                            <div key={step.number} className="flex flex-col items-center flex-1 relative">
                                {/* Connecting Line */}
                                {index < steps.length - 1 && (
                                    <div className={`absolute top-6 left-1/2 h-0.5 w-full ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                                )}

                                {/* Circle */}
                                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all ${isCompleted
                                        ? 'bg-green-500 border-green-500 shadow-lg shadow-green-200'
                                        : isCurrent
                                            ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-200 animate-pulse'
                                            : 'bg-white border-gray-300'
                                    }`}>
                                    <Icon className={`w-6 h-6 ${isCompleted || isCurrent ? 'text-white' : 'text-gray-400'}`} />
                                </div>

                                {/* Label */}
                                <div className="text-center mt-3">
                                    <p className={`text-sm font-semibold ${isCompleted || isCurrent ? 'text-black' : 'text-gray-500'}`}>
                                        {step.label}
                                    </p>
                                    {isCurrent && (
                                        <p className="text-xs text-blue-600 font-medium mt-1">Current Status</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-soft-gray-bg mesh-bg py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <Package className="w-8 h-8 text-primary-blue" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Track Your Order</h1>
                    <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base">
                        Enter your Order ID to see real-time updates on your delivery status.
                    </p>
                </div>

                {/* Search Card */}
                <div className="bg-white rounded-[2rem] p-2 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter Order ID (e.g., EACE0812)"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                                onKeyPress={(e) => e.key === 'Enter' && trackOrder()}
                                className="w-full h-14 pl-12 pr-4 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-primary-blue/20 text-lg font-medium placeholder:text-slate-400 transition-all outline-none"
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={trackOrder}
                            disabled={loading}
                            className="h-14 px-8 rounded-3xl shadow-lg shadow-primary-blue/20 text-base font-semibold"
                        >
                            {loading ? (
                                <Clock className="w-5 h-5 animate-spin" />
                            ) : (
                                "Track"
                            )}
                        </Button>
                    </div>
                    {error && (
                        <div className="mt-2 mx-2 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-2xl flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                            <XCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Order Details */}
                {order && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Status Timeline */}
                        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Order Status</h2>
                                    <p className="text-sm text-slate-500 font-mono mt-1">ID: #{order.id.slice(0, 8).toUpperCase()}</p>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                    order.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {order.status}
                                </div>
                            </div>
                            <StatusTimeline status={order.status} />
                        </div>

                        {/* Order Information Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Order Details */}
                            <Card className="p-6 glass-panel border-white/60">
                                <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    Order Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Order ID</p>
                                        <p className="font-mono font-bold text-black">#{order.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Order Date</p>
                                        <p className="text-sm text-black">
                                            {new Date(order.created_at).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Store</p>
                                        <p className="text-sm font-medium text-black">{order.store.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Total Amount</p>
                                        <p className="text-lg font-bold text-primary-blue">
                                            {order.currency === 'SOL'
                                                ? `${order.amount.toFixed(2)} SOL`
                                                : `$${order.amount.toFixed(2)}`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Delivery Info */}
                            <Card className="p-6 glass-panel border-white/60">
                                <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    Delivery Information
                                </h3>
                                <div className="space-y-3">
                                    {order.delivery_info?.name && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Recipient</p>
                                            <p className="text-sm text-black">{order.delivery_info.name}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Delivery Method</p>
                                        <p className="text-sm text-black capitalize">{order.delivery_method}</p>
                                    </div>
                                    {order.delivery_info?.city && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Location</p>
                                            <p className="text-sm text-black">
                                                {order.delivery_info.city}
                                                {order.delivery_info.zip && `, ${order.delivery_info.zip}`}
                                            </p>
                                        </div>
                                    )}
                                    {order.delivery_method === 'shipping' && order.status === 'shipped' && (
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl">
                                            <p className="text-sm text-blue-800 flex items-center gap-2">
                                                <Package className="w-4 h-4" /> Your order is on the way! Expected delivery: 2-3 business days
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Order Items */}
                        <Card className="p-6 glass-panel border-white/60">
                            <h3 className="text-lg font-bold text-black mb-4">Order Items</h3>
                            <div className="space-y-3">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-4 bg-white/70 rounded-2xl border border-white/60">
                                        {item.product.image_url ? (
                                            <img
                                                src={item.product.image_url}
                                                alt={item.product.name}
                                                className="w-16 h-16 object-cover rounded-2xl border border-white/60"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-white/60 rounded-2xl flex items-center justify-center">
                                                <Package className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold text-black">{item.product.name}</p>
                                            <p className="text-sm text-gray-600">Quantity: {item.qty}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-black">
                                                {order.currency === 'SOL'
                                                    ? `${(item.price * item.qty).toFixed(2)} SOL`
                                                    : `$${(item.price * item.qty).toFixed(2)}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
