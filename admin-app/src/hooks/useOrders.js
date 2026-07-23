import { useState, useCallback, useEffect } from 'react';
import { getAdminOrders } from '../api/order.api';

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    from: '',
    to: '',
    search: '',
  });

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const res = await getAdminOrders(params);
      let data = res.data || [];

      if (filters.search) {
        const q = filters.search.toLowerCase();
        data = data.filter(
          (o) =>
            o.orderNumber?.toLowerCase().includes(q) ||
            o.user?.name?.toLowerCase().includes(q) ||
            o.user?.phone?.includes(q)
        );
      }

      setOrders(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat data pesanan');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ status: '', paymentStatus: '', from: '', to: '', search: '' });
  }, []);

  return {
    orders,
    isLoading,
    error,
    filters,
    updateFilter,
    resetFilters,
    refetch: fetchOrders,
  };
}
