"use client";

import { Clock, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";

type Activity = {
    id: string;
    type: "purchase" | "sale";
    description: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
};

type ActivityFeedProps = {
    activities: Activity[];
};

export default function ActivityFeed({ activities }: ActivityFeedProps) {
    if (activities.length === 0) {
        return (
            <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-text mx-auto mb-3" />
                <p className="text-muted-text">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activities.map((activity) => (
                <Link
                    key={activity.id}
                    href={`/checkout/success/${activity.id}`}
                    className="block hover:bg-gray-50 -mx-6 px-6 py-3 transition-colors rounded-lg"
                >
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${activity.type === 'purchase'
                                ? 'bg-blue-100'
                                : 'bg-green-100'
                            }`}>
                            {activity.type === 'purchase' ? (
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                            ) : (
                                <Package className="w-5 h-5 text-green-600" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-black">
                                        {activity.type === 'purchase' ? 'Purchased' : 'Sold'}: {activity.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${activity.status === 'completed'
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : activity.status === 'shipped'
                                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                    : activity.status === 'processing'
                                                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}>
                                            {activity.status}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-muted-text">
                                            <Clock className="w-3 h-3" />
                                            {getRelativeTime(activity.date)}
                                        </span>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-black">
                                        {activity.currency === 'SOL'
                                            ? `${activity.amount.toFixed(2)} SOL`
                                            : `$${activity.amount.toFixed(2)}`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
