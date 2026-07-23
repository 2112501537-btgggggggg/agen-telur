import { useState, useCallback, useEffect } from 'react';
import { getStockIns, createStockIn } from '../api/stock.api';
import { useToast } from '../context/ToastContext';

export function useStockIns() {
  const [stockIns, setStockIns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchStockIns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getStockIns();
      setStockIns(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat riwayat stok masuk');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStockIns(); }, [fetchStockIns]);

  const handleCreate = useCallback(async (data) => {
    try {
      await createStockIn(data);
      addToast('Stok masuk berhasil dicatat');
      await fetchStockIns();
      return true;
    } catch (err) {
      addToast(err?.response?.data?.message || 'Gagal mencatat stok masuk', 'error');
      return false;
    }
  }, [fetchStockIns, addToast]);

  return { stockIns, isLoading, error, refetch: fetchStockIns, handleCreate };
}
