import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase";

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

    const supabase = getSupabaseClient();

    const fetchNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

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
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id);

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id);

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read", error);
        }
    }

    const deleteNotification = async (id: string) => {
        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => notifications.find(n => n.id === id && !n.read) ? prev - 1 : prev);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

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
