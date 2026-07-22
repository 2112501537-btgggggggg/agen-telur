import { useState, useEffect, useCallback } from 'react';
import { getDashboardSummary, getSalesReport } from '../api/dashboard.api';

function getDateRange(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export function useDashboardSummary() {
  const [data, setData] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summary, sales] = await Promise.all([
        getDashboardSummary(),
        getSalesReport(getDateRange(7).from, getDateRange(7).to),
      ]);
      setData(summary.data);
      setSalesData(sales.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, salesData, isLoading, error, refetch: fetchAll };
}
