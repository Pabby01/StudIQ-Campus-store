import React, { useState } from 'react';
import { Trash2, Plus, Edit2, CheckCircle } from 'lucide-react';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import Button from '@/components/ui/Button';
import type { SavedAddress } from '@/app/api/profile/addresses/route';

interface SavedAddressesManagerProps {
  walletAddress: string | undefined;
}

export const SavedAddressesManager: React.FC<SavedAddressesManagerProps> = ({
  walletAddress,
}) => {
  const {
    addresses,
    loading,
    error,
    addAddress,
    updateAddress,
    deleteAddress,
  } = useSavedAddresses(walletAddress);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '',
    zip: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleAddAddress = async () => {
    if (!formData.name || !formData.location || !formData.city || !formData.zip) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await addAddress(
        formData.name,
        formData.location,
        formData.city,
        formData.zip,
        formData.phone
      );
      setFormData({ name: '', location: '', city: '', zip: '', phone: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to add address:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress(addressId);
      } catch (err) {
        console.error('Failed to delete address:', err);
      }
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await updateAddress(addressId, { isDefault: true });
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  if (loading) return <div className="text-center py-4">Loading addresses...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Add Address
        </Button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
          <input
            type="text"
            placeholder="Address Name (e.g., Home, Dorm)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Street Address"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="ZIP Code"
            value={formData.zip}
            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleAddAddress}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Saving...' : 'Save Address'}
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

      {/* Addresses List */}
      <div className="space-y-2">
        {addresses.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded text-center text-gray-500">
            No saved addresses yet. Add one to speed up checkout!
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address.id}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{address.name}</h4>
                    {address.isDefault && (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                        <CheckCircle size={12} /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{address.location}</p>
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.zip}
                  </p>
                  {address.phone && (
                    <p className="text-sm text-gray-600">{address.phone}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!address.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(address.id)}
                      className="text-xs"
                    >
                      Set Default
                    </Button>
                  )}
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete address"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
