import { useState, useCallback } from 'react';
import { getStockAdjustments, createStockAdjustment } from '../api/stock.api';
import { useToast } from '../context/ToastContext';

export function useStockAdjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchAdjustments = useCallback(async (variantId) => {
    if (!variantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getStockAdjustments(variantId);
      setAdjustments(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat riwayat adjustment');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreate = useCallback(async (variantId, data) => {
    try {
      await createStockAdjustment(variantId, data);
      addToast('Adjustment stok berhasil dicatat');
      await fetchAdjustments(variantId);
      return true;
    } catch (err) {
      addToast(err?.response?.data?.message || 'Gagal mencatat adjustment', 'error');
      return false;
    }
  }, [fetchAdjustments, addToast]);

  return { adjustments, isLoading, error, fetchAdjustments, handleCreate };
}
