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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <Package className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-black">Track Your Order</h1>
                    <p className="text-muted-text max-w-md mx-auto">
                        Enter your Order ID to see real-time updates on your delivery
                    </p>
                </div>

                {/* Search Card */}
                <Card className="p-8">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Enter Order ID (e.g., EACE0812)"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                                onKeyPress={(e) => e.key === 'Enter' && trackOrder()}
                                className="text-lg"
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={trackOrder}
                            disabled={loading}
                            className="px-8"
                        >
                            {loading ? (
                                <Clock className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Search className="w-5 h-5 mr-2" />
                                    Track
                                </>
                            )}
                        </Button>
                    </div>
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </Card>

                {/* Order Details */}
                {order && (
                    <div className="space-y-6">
                        {/* Status Timeline */}
                        <Card className="p-8">
                            <h2 className="text-xl font-bold text-black mb-8">Order Status</h2>
                            <StatusTimeline status={order.status} />
                        </Card>

                        {/* Order Information Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Order Details */}
                            <Card className="p-6">
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
                            <Card className="p-6">
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
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                📦 Your order is on the way! Expected delivery: 2-3 business days
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Order Items */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-black mb-4">Order Items</h3>
                            <div className="space-y-3">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        {item.product.image_url ? (
                                            <img
                                                src={item.product.image_url}
                                                alt={item.product.name}
                                                className="w-16 h-16 object-cover rounded-md border border-gray-300"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
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
