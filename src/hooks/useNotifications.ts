import { useState, useEffect } from "react";
import { useCivicWallet } from "@/hooks/useCivicWallet";

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    created_at: string;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { walletAddress } = useCivicWallet();

    const fetchNotifications = async () => {
        try {
            if (!walletAddress) {
                setLoading(false);
                return;
            }

            const res = await fetch('/api/notifications');
            if (!res.ok) throw new Error("Failed to fetch notifications");
            const data = await res.json();

            setNotifications(data || []);
            setUnreadCount(data?.filter((n: Notification) => !n.read).length || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markRead', id })
            });

            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            if (!walletAddress) return;

            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markAllRead' })
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Error marking all as read", error);
        }
    }

    const deleteNotification = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                setUnreadCount(prev => notifications.find(n => n.id === id && !n.read) ? prev - 1 : prev);
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    useEffect(() => {
        if (walletAddress) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [walletAddress]);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh: fetchNotifications
    };
}
