"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Download, ArrowLeft, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import "../print.css";

type OrderDetails = {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
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
    items: {
        id: string;
        price: number;
        qty: number;
        product: {
            name: string;
        };
    }[];
};

export default function OrderSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (params.id) {
            fetchOrder(params.id as string);
        }
    }, [params.id]);

    const fetchOrder = async (id: string) => {
        try {
            const res = await fetch(`/api/orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data.order);
            }
        } catch (error) {
            console.error("Failed to fetch order", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadReceipt = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Order not found</h2>
                    <Button onClick={() => router.push("/")}>Return Home</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-soft-gray-bg py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Success Header - Hidden on print */}
                <div className="text-center space-y-4 no-print">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-black">Order Placed Successfully!</h1>
                    <p className="text-muted-text max-w-md mx-auto">
                        Thank you for your purchase. A validation email has been sent to {order.buyer_email || order.delivery_info.email}.
                        <br />
                        {order.payment_method === 'pod' || (order.payment_method as any) === 'pickup'
                            ? "Please be ready to pay upon receipt."
                            : "Your transaction has been confirmed."}
                    </p>
                    <div className="flex justify-center gap-4 pt-4">
                        <Button variant="outline" onClick={() => router.push("/")}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Continue Shopping
                        </Button>
                        <Button variant="primary" onClick={downloadReceipt}>
                            <Download className="w-4 h-4 mr-2" />
                            Print Receipt
                        </Button>
                    </div>
                </div>

                {/* Receipt - This will be the only thing that prints */}
                <div className="flex justify-center">
                    <div id="receipt-container" ref={receiptRef} className="bg-white p-10 rounded-2xl shadow-lg border-2 border-gray-100 w-full max-w-2xl">

                        {/* Modern Receipt Header with gradient */}
                        <div className="border-b-2 border-gray-200 pb-8 mb-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-md">
                                            <span className="text-white font-bold text-xl">S</span>
                                        </div>
                                        <div>
                                            <span className="text-2xl font-bold text-gray-900">StudiQ Store</span>
                                            <p className="text-sm text-gray-500">Campus Marketplace</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                                        <p className="text-xs text-blue-600 uppercase tracking-wider font-bold mb-1">Receipt</p>
                                        <p className="font-mono font-bold text-gray-900 text-lg">#{order.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info with improved design */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-wide">Billed To</p>
                                <p className="font-semibold text-gray-900 text-lg">{order.delivery_info.name}</p>
                                <p className="text-sm text-gray-600 mt-1">{order.buyer_email}</p>
                                {order.delivery_method === 'shipping' && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        {order.delivery_info.address}<br />
                                        {order.delivery_info.city}, {order.delivery_info.zip}
                                    </p>
                                )}
                            </div>
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-wide">Payment Details</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Method:</span>
                                        <span className="text-sm font-semibold text-gray-900 print-brand-color">
                                            {order.payment_method === 'solana' ? 'Crypto (SOL)' : 'Cash on Delivery'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Status:</span>
                                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {order.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items with enhanced table design */}
                        <div className="mb-10">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-xl overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-left py-4 px-4 text-xs uppercase font-bold tracking-wide">Item</th>
                                            <th className="text-center py-4 px-4 text-xs uppercase font-bold tracking-wide">Qty</th>
                                            <th className="text-right py-4 px-4 text-xs uppercase font-bold tracking-wide">Price</th>
                                            <th className="text-right py-4 px-4 text-xs uppercase font-bold tracking-wide">Total</th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>
                            <div className="border-x-2 border-b-2 border-gray-200 rounded-b-xl overflow-hidden">
                                <table className="w-full">
                                    <tbody className="divide-y divide-gray-100">
                                        {order.items.map((item, idx) => (
                                            <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="py-4 px-4 text-sm text-gray-900 font-medium">{item.product.name}</td>
                                                <td className="py-4 text-center text-sm text-gray-600 font-semibold">{item.qty}</td>
                                                <td className="py-4 px-4 text-right text-sm text-gray-600">
                                                    {order.currency === 'SOL' ? `${item.price.toFixed(2)} SOL` : `$${item.price.toFixed(2)}`}
                                                </td>
                                                <td className="py-4 px-4 text-right text-sm text-gray-900 font-semibold">
                                                    {order.currency === 'SOL' ? `${(item.price * item.qty).toFixed(2)} SOL` : `$${(item.price * item.qty).toFixed(2)}`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals with enhanced styling */}
                        <div className="border-t-2 border-gray-200 pt-8">
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-gray-900">
                                        {order.currency === 'SOL' ? `${order.amount.toFixed(2)} SOL` : `$${order.amount.toFixed(2)}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="text-green-600 font-semibold print-success-color">
                                        {order.delivery_method === 'pickup' ? 'Pickup' : 'Free'}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-xl text-gray-900">Total</span>
                                    <span className="font-bold text-3xl text-blue-600 print-brand-color">
                                        {order.currency === 'SOL' ? `${order.amount.toFixed(2)} SOL` : `$${order.amount.toFixed(2)}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer with thank you message */}
                        <div className="mt-12 text-center pt-8 border-t-2 border-gray-200">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                <p className="text-lg font-semibold text-gray-900 mb-2">Thank you for shopping with StudiQ!</p>
                                <p className="text-sm text-gray-600">Questions? Email us at support@studiq.com</p>
                                <div className="mt-4 pt-4 border-t border-blue-200">
                                    <p className="text-xs text-gray-500">This is an official receipt for your order</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
