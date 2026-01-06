"use client";

import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
    const params = useParams();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-soft-gray-bg p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <Link
                    href={`/dashboard/store/${params.id}/products`}
                    className="inline-flex items-center gap-2 text-muted-text hover:text-black transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Products
                </Link>

                <div>
                    <h1 className="text-3xl font-bold text-black mb-2">Add New Product</h1>
                    <p className="text-muted-text">
                        Fill in the details below to add a product to your store
                    </p>
                </div>

                {/* Using reusable ProductForm component which handles Multi-Image and Currency logic */}
                <ProductForm
                    storeId={Array.isArray(params.id) ? params.id[0] : params.id}
                    onSuccess={() => {
                        router.refresh();
                        router.push(`/dashboard/store/${params.id}/products`);
                    }}
                />

                <Card className="p-6 bg-blue-50 border-blue-200">
                    <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary-blue" />
                        Tips for Great Product Listings
                    </h3>
                    <ul className="text-sm text-muted-text space-y-1 list-disc list-inside">
                        <li>Use clear, high-quality images</li>
                        <li>Write detailed, accurate descriptions</li>
                        <li>Set competitive prices</li>
                        <li>Keep inventory updated</li>
                        <li>Choose the right category for better discoverability</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
}
