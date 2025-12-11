"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Download, ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

    const downloadReceipt = async () => {
        if (!receiptRef.current) return;

        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
            pdf.save(`Receipt-${order?.id.slice(0, 8)}.pdf`);
        } catch (err) {
            console.error("Receipt generation failed", err);
        }
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

                {/* Success Header */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-10 h-10 text-green-600" />
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
                            Download Receipt
                        </Button>
                    </div>
                </div>

                {/* Receipt Preview (Hidden from view only if needed, but here we show it card style) */}
                <div className="flex justify-center">
                    <div ref={receiptRef} className="bg-white p-8 rounded-xl shadow-sm border border-border-gray w-full max-w-2xl">
                        {/* Receipt Header */}
                        <div className="border-b border-border-gray pb-6 mb-6 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-xs">S</span>
                                    </div>
                                    <span className="text-xl font-bold text-black">StudiQ Store</span>
                                </div>
                                <p className="text-sm text-muted-text">Campus Marketplace</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-text uppercase tracking-wider mb-1">Receipt</p>
                                <p className="font-mono font-medium text-black">#{order.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-sm text-muted-text mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <p className="text-xs text-muted-text uppercase font-bold mb-2">Billed To</p>
                                <p className="font-medium text-black">{order.delivery_info.name}</p>
                                <p className="text-sm text-muted-text">{order.buyer_email}</p>
                                {order.delivery_method === 'shipping' && (
                                    <p className="text-sm text-muted-text mt-1">{order.delivery_info.address}, {order.delivery_info.city}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-muted-text uppercase font-bold mb-2">Payment Details</p>
                                <p className="text-sm text-black">
                                    <span className="text-muted-text">Method:</span> {order.payment_method === 'solana' ? 'Crypto (SOL)' : 'Cash on Delivery'}
                                </p>
                                <p className="text-sm text-black">
                                    <span className="text-muted-text">Status:</span> {order.status.toUpperCase()}
                                </p>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="mb-8">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border-gray">
                                        <th className="text-left py-2 text-xs text-muted-text uppercase font-bold">Item</th>
                                        <th className="text-center py-2 text-xs text-muted-text uppercase font-bold">Qty</th>
                                        <th className="text-right py-2 text-xs text-muted-text uppercase font-bold">Price</th>
                                        <th className="text-right py-2 text-xs text-muted-text uppercase font-bold">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-gray">
                                    {order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="py-3 text-sm text-black font-medium">{item.product.name}</td>
                                            <td className="py-3 text-center text-sm text-muted-text">{item.qty}</td>
                                            <td className="py-3 text-right text-sm text-muted-text">
                                                {order.currency === 'SOL' ? 'SOL' : '$'}{item.price.toFixed(2)}
                                            </td>
                                            <td className="py-3 text-right text-sm text-black font-medium">
                                                {order.currency === 'SOL' ? 'SOL' : '$'}{(item.price * item.qty).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="border-t border-border-gray pt-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-muted-text">Subtotal</span>
                                <span className="font-medium">{order.currency === 'SOL' ? 'SOL' : '$'}{order.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-4">
                                <span className="text-muted-text">Shipping</span>
                                <span className="text-green-600 font-medium">{order.delivery_method === 'pickup' ? 'Pickup' : 'Free'}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-border-gray pt-4">
                                <span className="font-bold text-lg text-black">Total</span>
                                <span className="font-bold text-2xl text-primary-blue">{order.currency === 'SOL' ? 'SOL' : '$'}{order.amount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 text-center pt-8 border-t border-border-gray">
                            <p className="text-sm text-muted-text">Thank you for shopping with StudiQ Campus Store!</p>
                            <p className="text-xs text-muted-text mt-1">If you have any questions, contact support at support@studiq.com</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
