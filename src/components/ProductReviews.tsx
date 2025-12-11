"use client";

import { useState, useEffect } from "react";
import { Star, StarHalf, User } from "lucide-react";
import Button from "@/components/ui/Button";
import { useWallet } from "@solana/react-hooks";
import { useToast } from "@/hooks/useToast";

type Review = {
    id: string;
    reviewer_address: string;
    rating: number;
    content: string;
    created_at: string;
    reviewer_name?: string; // Optional if we join with profiles
};

export default function ProductReviews({ productId }: { productId: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const wallet = useWallet();
    const { toast } = useToast();

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/review?productId=${productId}`);
            const data = await res.json();
            setReviews(data.reviews || []);
        } catch (e) {
            console.error("Failed to fetch reviews");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (wallet.status !== "connected") {
            toast({ title: "Error", description: "Please connect wallet to review", type: "error" });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    address: wallet.session?.account.address.toString(),
                    rating,
                    content,
                }),
            });

            if (res.ok) {
                toast({ title: "Review submitted", description: "Thanks for your feedback!", type: "success" });
                setContent("");
                setRating(5);
                fetchReviews();
            } else {
                throw new Error("Failed to submit");
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to submit review", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-12 space-y-8">
            <h2 className="text-2xl font-bold text-black">Reviews ({reviews.length})</h2>

            {/* Review Form */}
            {wallet.status === "connected" ? (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-border-gray space-y-4">
                    <h3 className="font-semibold text-lg">Write a Review</h3>
                    <div>
                        <label className="block text-sm font-medium mb-2">Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={`w-6 h-6 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Review</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full p-3 border border-border-gray rounded-lg focus:ring-2 focus:ring-primary-blue outline-none"
                            rows={3}
                            placeholder="Share your thoughts..."
                            required
                        />
                    </div>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Submitting..." : "Post Review"}
                    </Button>
                </form>
            ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-muted-text">Connect your wallet to leave a review.</p>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.length === 0 && !loading && (
                    <p className="text-muted-text">No reviews yet. Be the first to review!</p>
                )}
                {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border-gray pb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary-blue" />
                                </div>
                                <span className="font-medium text-black">
                                    {review.reviewer_address.slice(0, 4)}...{review.reviewer_address.slice(-4)}
                                </span>
                            </div>
                            <span className="text-sm text-muted-text">
                                {new Date(review.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                />
                            ))}
                        </div>
                        <p className="text-gray-700">{review.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
