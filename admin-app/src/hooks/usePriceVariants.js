import { useState, useCallback, useEffect } from 'react';
import { getVariantPrices, updateVariantPrice, getPriceHistory } from '../api/price.api';
import { useToast } from '../context/ToastContext';

export function usePriceVariants() {
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  const fetchVariants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getVariantPrices();
      setVariants(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat data harga');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const handleUpdatePrice = useCallback(async (variantId, newPrice, variantLabel) => {
    try {
      await updateVariantPrice(variantId, newPrice);
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId
            ? { ...v, pricePerKg: newPrice, lastPriceUpdateAt: new Date().toISOString() }
            : v
        )
      );
      addToast(`Harga ${variantLabel} diperbarui ke Rp${Number(newPrice).toLocaleString('id-ID')}`);
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal memperbarui harga';
      addToast(msg, 'error');
      return { success: false, message: msg };
    }
  }, [addToast]);

  const filtered = search
    ? variants.filter((v) => v.product?.name?.toLowerCase().includes(search.toLowerCase()))
    : variants;

  return {
    variants: filtered,
    isLoading,
    error,
    search,
    setSearch,
    refetch: fetchVariants,
    handleUpdatePrice,
  };
}

export function usePriceHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (variantId) => {
    if (!variantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getPriceHistory(variantId);
      setHistory(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat riwayat harga');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setError(null);
  }, []);

  return { history, isLoading, error, fetchHistory, clearHistory };
}
