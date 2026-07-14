import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface ReviewSnippet {
  id: string;
  rating: number;
  content: string;
  reviewerName: string;
  createdAt: string;
}

interface ReviewSnippetDisplayProps {
  productId: string;
  rating?: number | null;
  reviewCount?: number;
}

export const ReviewSnippetDisplay: React.FC<ReviewSnippetDisplayProps> = ({
  productId,
  rating,
  reviewCount,
}) => {
  const [review, setReview] = useState<ReviewSnippet | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);

  useEffect(() => {
    if (showSnippet && !review && !loading) {
      fetchReview();
    }
  }, [showSnippet]);

  const fetchReview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/review/snippet?productId=${productId}`);
      const data = await res.json();
      if (data.review) {
        setReview(data.review);
      }
    } catch (error) {
      console.error('Failed to fetch review snippet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Rating Bar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={`${
                rating && i < Math.round(rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-gray-700">
          {rating ? rating.toFixed(1) : 'No rating'}
        </span>
        {reviewCount && (
          <span className="text-xs text-gray-500">({reviewCount})</span>
        )}
      </div>

      {/* Review Snippet (Lazy Loaded) */}
      {review && (
        <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
          <p className="font-medium text-blue-900 truncate">
            {review.reviewerName} <span className="font-normal">gave {review.rating} stars</span>
          </p>
          <p className="text-blue-800 line-clamp-2 mt-1">"{review.content}"</p>
        </div>
      )}

      {/* Show Review Button */}
      {!review && reviewCount && reviewCount > 0 && (
        <button
          onClick={() => setShowSnippet(true)}
          disabled={loading}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'See reviews'}
        </button>
      )}
    </div>
  );
};
