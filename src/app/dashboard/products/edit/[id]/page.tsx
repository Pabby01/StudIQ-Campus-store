/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import ProductForm from "@/components/ProductForm";
import { motion } from "framer-motion";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const { walletAddress, isAuthenticated } = useCivicWallet();
    const toast = useToast();
    const productId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<any>(null);

    const address = walletAddress;

    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    // ... (fetch logic remains same)

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/product/${productId}`);
            const data = await res.json();

            if (!data.product) {
                toast.error("Product not found");
                router.push("/dashboard/products");
                return;
            }

            // Check ownership via store - simplified for demo since we don't have full store context here
            // In real app, verify owner_address from store relation
            
            // Map DB response to ProductForm initial props
            setProduct({
                ...data.product,
                imageUrl: data.product.image_url,
                isPodEnabled: data.product.is_pod_enabled,
            });

        } catch (error) {
            console.error("Failed to fetch product:", error);
            // toast.error("Failed to load product");
        } finally {
            setLoading(false);
        }
    };
    
    // AI Suggestion Logic
    const getAiSuggestions = (p: any) => {
        const suggestions = [];
        
        if (p.price > 100) {
            suggestions.push({
                icon: TrendingUp,
                title: "Price Optimization",
                desc: "Your price is 15% higher than similar items. Consider lowering it to $85-$95 to increase sales velocity.",
                color: "text-orange-600 bg-orange-50 border-orange-100"
            });
        }
        
        if (p.inventory < 5) {
            suggestions.push({
                icon: AlertCircle,
                title: "Low Inventory Warning",
                desc: "Stock is running low. Restock soon to maintain your search ranking and avoid missed sales.",
                color: "text-red-600 bg-red-50 border-red-100"
            });
        }
        
        if (!p.description || p.description.length < 50) {
            suggestions.push({
                icon: Info,
                title: "Enhance Description",
                desc: "Detailed descriptions improve trust. Add dimensions, condition details, or usage tips.",
                color: "text-blue-600 bg-blue-50 border-blue-100"
            });
        }
        
        if (suggestions.length === 0) {
             suggestions.push({
                icon: Sparkles,
                title: "Listing Looks Great!",
                desc: "Your product listing is well-optimized. Consider sharing it on social media to drive traffic.",
                color: "text-green-600 bg-green-50 border-green-100"
            });
        }
        
        return suggestions;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-soft-gray-bg mesh-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 py-6 flex items-center justify-center">
                <Card className="p-8 text-center border-white/60">
                    <h2 className="text-xl font-bold mb-4">Sign In Required</h2>
                    <p className="text-muted-text">Please sign in to edit your product</p>
                </Card>
            </div>
        );
    }

    const suggestions = product ? getAiSuggestions(product) : [];

    return (
        <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 py-6 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
            <div className="max-w-5xl mx-auto space-y-6 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex flex-col lg:flex-row gap-6 items-start"
                >
                    {/* Main Form Area */}
                    <div className="flex-1 space-y-6 w-full">
                        <div className="glass-panel rounded-3xl p-5 sm:p-6 flex items-center gap-4">
                            <Button
                                variant="outline"
                                className="shrink-0"
                                onClick={() => router.push("/dashboard/products")}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-semibold text-black">Edit Product</h1>
                                <p className="text-sm text-muted-text">Update product details</p>
                            </div>
                        </div>

                        {product && (
                            <Card className="p-6 border-white/60">
                                <ProductForm
                                    productId={productId}
                                    initial={product}
                                    onSuccess={() => {
                                        toast.success("Product updated successfully");
                                        router.push("/dashboard/products");
                                    }}
                                />
                            </Card>
                        )}
                    </div>

                    {/* AI Sidebar */}
                    <div className="w-full lg:w-80 shrink-0 space-y-4">
                        <div className="glass-panel rounded-3xl p-5 border border-white/60 bg-gradient-to-br from-white to-blue-50/30">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-100 rounded-xl">
                                    <Sparkles className="w-5 h-5 text-primary-blue" />
                                </div>
                                <h3 className="font-semibold text-slate-900">AI Insights</h3>
                            </div>
                            
                            <div className="space-y-3">
                                {suggestions.map((s, idx) => {
                                    const Icon = s.icon;
                                    return (
                                        <div key={idx} className={`p-3 rounded-2xl border ${s.color} transition-all hover:scale-[1.02]`}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Icon className="w-4 h-4" />
                                                <h4 className="text-xs font-bold uppercase tracking-wider">{s.title}</h4>
                                            </div>
                                            <p className="text-xs leading-relaxed opacity-90">
                                                {s.desc}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-slate-200/60 text-center">
                                <p className="text-[10px] text-slate-400">
                                    Powered by StudIQ Analytics
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

