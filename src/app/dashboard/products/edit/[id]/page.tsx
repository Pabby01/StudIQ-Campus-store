"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import ProductForm from "@/components/ProductForm";

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
        if (productId && address) {
            fetchProduct();
        }
    }, [productId, address]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/products/${productId}`);
            const data = await res.json();

            if (!data.product) {
                toast.error("Product not found");
                router.push("/dashboard/products");
                return;
            }

            // Check ownership via store
            if (data.product.stores?.owner_address !== address) {
                toast.error("You don't have permission to edit this product");
                router.push("/dashboard/products");
                return;
            }

            // Map DB response to ProductForm initial props
            setProduct({
                ...data.product,
                imageUrl: data.product.image_url,
                isPodEnabled: data.product.is_pod_enabled,
            });

        } catch (error) {
            console.error("Failed to fetch product:", error);
            toast.error("Failed to load product");
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-soft-gray-bg p-8 flex items-center justify-center">
                <Card className="p-8 text-center">
                    <h2 className="text-xl font-bold mb-4">Sign In Required</h2>
                    <p className="text-muted-text">Please sign in to edit your product</p>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-soft-gray-bg p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-soft-gray-bg px-4 py-6 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        className="shrink-0"
                        onClick={() => router.push("/dashboard/products")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-black">Edit Product</h1>
                        <p className="text-sm md:text-base text-muted-text">Update product details</p>
                    </div>
                </div>

                {/* Edit Form */}
                {product && (
                    <ProductForm
                        productId={productId}
                        initial={product}
                        onSuccess={() => {
                            router.refresh();
                            router.push("/dashboard/products");
                        }}
                    />
                )}
            </div>
        </div>
    );
}

