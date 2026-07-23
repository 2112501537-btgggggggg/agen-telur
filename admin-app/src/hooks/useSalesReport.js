import { useState, useCallback, useEffect } from 'react';
import { getSalesReport } from '../api/report.api';

export function useSalesReport(dateRange) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getSalesReport(dateRange.from, dateRange.to);
      setData(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat laporan penjualan');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalRevenue = data.reduce((sum, row) => sum + (row.totalSales || 0), 0);
  const totalDays = data.length;

  return {
    data,
    totalRevenue,
    totalDays,
    isLoading,
    error,
    refetch: fetchReport,
  };
}
