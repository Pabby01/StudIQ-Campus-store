import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Plus } from 'lucide-react';
import { useInventoryAlerts } from '@/hooks/useInventoryAlerts';
import Button from '@/components/ui/Button';

interface Product {
  id: string;
  name: string;
  inventory: number;
}

interface InventoryAlertsManagerProps {
  storeId: string;
  products: Product[];
}

export const InventoryAlertsManager: React.FC<InventoryAlertsManagerProps> = ({
  storeId,
  products,
}) => {
  const {
    alerts,
    loading,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
  } = useInventoryAlerts(storeId);

  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [threshold, setThreshold] = useState('5');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateAlert = async () => {
    if (!selectedProductId || !threshold) {
      alert('Please select a product and set a threshold');
      return;
    }

    setSubmitting(true);
    try {
      await createAlert(selectedProductId, parseInt(threshold));
      setSelectedProductId('');
      setThreshold('5');
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create alert:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      try {
        await deleteAlert(alertId);
      } catch (err) {
        console.error('Failed to delete alert:', err);
      }
    }
  };

  if (loading) return <div className="text-center py-4">Loading alerts...</div>;

  // Get products without alerts
  const productsWithoutAlerts = products.filter(
    (p) => !alerts.some((a) => a.id === p.id)
  );

  // Get products with low stock
  const lowStockProducts = products.filter((p) => {
    const alert = alerts.find((a) => a.id === p.id);
    return alert && p.inventory <= alert.threshold;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bell size={20} /> Inventory Alerts
        </h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Add Alert
        </Button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      {/* Low Stock Warning */}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">
            ⚠️ Low Stock Alert: {lowStockProducts.length} product(s)
          </h4>
          <ul className="space-y-1">
            {lowStockProducts.map((p) => {
              const alert = alerts.find((a) => a.id === p.id);
              return (
                <li key={p.id} className="text-sm text-yellow-800">
                  <strong>{p.name}</strong>: {p.inventory} units (threshold: {alert?.threshold})
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Add Alert Form */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="">Select a product</option>
            {productsWithoutAlerts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Current: {p.inventory})
              </option>
            ))}
          </select>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Alert Threshold (alert when inventory drops below):
            </label>
            <input
              type="number"
              min="1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="e.g., 5"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateAlert}
              disabled={submitting || !selectedProductId}
              className="flex-1"
            >
              {submitting ? 'Creating...' : 'Create Alert'}
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Active Alerts List */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Active Alerts</h4>
        {alerts.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded text-center text-gray-500">
            No inventory alerts set yet. Create one to get notified when stock is low!
          </div>
        ) : (
          alerts.map((alert) => {
            const product = products.find((p) => p.id === alert.id);
            const isLowStock = product && product.inventory <= alert.threshold;

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  isLowStock
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                } hover:border-purple-300 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">
                      {alert.productName}
                    </h5>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Current Stock</p>
                        <p className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                          {alert.currentInventory} units
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Alert Threshold</p>
                        <p className="font-semibold text-gray-900">
                          {alert.threshold} units
                        </p>
                      </div>
                    </div>
                    {isLowStock && (
                      <p className="mt-2 text-sm text-red-600 font-medium">
                        ⚠️ Stock below threshold - consider restocking!
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete alert"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tip</h4>
        <p className="text-sm text-blue-800">
          Set alerts for your best-selling products to avoid missing sales due to low stock.
          We recommend a threshold of 5-10 units depending on your typical sales volume.
        </p>
      </div>
    </div>
  );
};
