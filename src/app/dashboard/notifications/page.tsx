"use client";

import { useNotifications } from "@/hooks/useNotifications";
import Card from "@/components/ui/Card";
import { Bell, Check, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotificationsPage() {
    const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {notifications.length}
                    </span>
                </div>

                {notifications.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs"
                    >
                        <Check className="w-3 h-3 mr-1" />
                        Mark all read
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card className="text-center py-16">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`
                group relative flex items-start gap-4 p-4 rounded-xl border transition-all
                ${notification.read ? 'bg-white border-gray-100' : 'bg-blue-50/30 border-blue-100 shadow-sm'}
              `}
                        >
                            <div className="mt-1 flex-shrink-0">
                                {getIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-semibold mb-1 ${notification.read ? 'text-gray-900' : 'text-blue-900'}`}>
                                    {notification.title}
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {notification.message}
                                </p>
                                <span className="text-xs text-gray-400 mt-2 block">
                                    {new Date(notification.created_at).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-white/50 backdrop-blur-sm p-1 rounded-lg sm:bg-transparent sm:static sm:opacity-100">
                                <button
                                    onClick={() => deleteNotification(notification.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                {!notification.read && (
                                    <button
                                        onClick={() => markAsRead(notification.id)}
                                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Mark read"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
