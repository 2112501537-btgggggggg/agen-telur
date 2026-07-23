import { useState, useCallback, useEffect } from 'react';
import { getDamagedReport } from '../api/report.api';

export function useDamagedReport() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getDamagedReport(50);
      setData(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat laporan kerusakan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalDamaged = data.reduce((sum, row) => sum + (row.totalDamaged || 0), 0);

  return {
    data,
    totalDamaged,
    isLoading,
    error,
    refetch: fetchReport,
  };
}
