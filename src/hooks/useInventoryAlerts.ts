import { useState, useEffect } from 'react';
import type { InventoryAlert } from '@/app/api/inventory/alerts/route';

export const useInventoryAlerts = (storeId: string | undefined) => {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setAlerts([]);
      return;
    }

    fetchAlerts();
  }, [storeId]);

  const fetchAlerts = async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/inventory/alerts?storeId=${storeId}`);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (productId: string, threshold: number) => {
    if (!storeId) return;

    try {
      const res = await fetch('/api/inventory/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          productId,
          threshold,
        }),
      });

      if (!res.ok) throw new Error('Failed to create alert');
      const data = await res.json();
      setAlerts((prev) => [...prev, data.alert]);
      return data.alert;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
      throw err;
    }
  };

  const updateAlert = async (alertId: string, threshold?: number, isActive?: boolean) => {
    try {
      const res = await fetch('/api/inventory/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          threshold,
          isActive,
        }),
      });

      if (!res.ok) throw new Error('Failed to update alert');
      const data = await res.json();
      
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === alertId ? data.alert : alert))
      );
      return data.alert;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert');
      throw err;
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/inventory/alerts?alertId=${alertId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete alert');
      
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert');
      throw err;
    }
  };

  return {
    alerts,
    loading,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
    refetch: fetchAlerts,
  };
};
