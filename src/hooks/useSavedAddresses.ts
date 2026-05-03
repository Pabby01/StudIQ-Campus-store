import { useState, useEffect } from 'react';
import type { SavedAddress } from '@/app/api/profile/addresses/route';

export const useSavedAddresses = (walletAddress: string | undefined) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch addresses on mount or when wallet changes
  useEffect(() => {
    if (!walletAddress) {
      setAddresses([]);
      return;
    }

    fetchAddresses();
  }, [walletAddress]);

  const fetchAddresses = async () => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/profile/addresses?address=${walletAddress}`);
      if (!res.ok) throw new Error('Failed to fetch addresses');
      const data = await res.json();
      setAddresses(data.addresses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async (
    name: string,
    location: string,
    city: string,
    zip: string,
    phone?: string,
    isDefault?: boolean
  ) => {
    if (!walletAddress) return;

    try {
      const res = await fetch('/api/profile/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          name,
          location,
          city,
          zip,
          phone,
          isDefault,
        }),
      });

      if (!res.ok) throw new Error('Failed to add address');
      const data = await res.json();
      setAddresses((prev) => [...prev, data.address]);
      return data.address;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add address';
      setError(message);
      throw err;
    }
  };

  const updateAddress = async (
    addressId: string,
    updates: Partial<SavedAddress>
  ) => {
    if (!walletAddress) return;

    try {
      const res = await fetch('/api/profile/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          addressId,
          ...updates,
        }),
      });

      if (!res.ok) throw new Error('Failed to update address');
      const data = await res.json();
      setAddresses(data.addresses);
      return data.addresses;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update address';
      setError(message);
      throw err;
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!walletAddress) return;

    try {
      const res = await fetch(
        `/api/profile/addresses?address=${walletAddress}&addressId=${addressId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Failed to delete address');
      const data = await res.json();
      setAddresses(data.addresses);
      return data.addresses;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete address';
      setError(message);
      throw err;
    }
  };

  const getDefaultAddress = () => {
    return addresses.find((addr) => addr.isDefault);
  };

  return {
    addresses,
    loading,
    error,
    addAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddress,
    refetch: fetchAddresses,
  };
};
