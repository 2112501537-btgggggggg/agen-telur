import { useState, useCallback, useEffect } from 'react';
import { getAdminServiceAreas, createServiceArea, updateServiceArea, deleteServiceArea } from '../api/serviceArea.api';
import { useToast } from '../context/ToastContext';

export function useServiceAreas() {
  const [areas, setAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  const fetchAreas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminServiceAreas();
      setAreas(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat data service area');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const filteredAreas = areas.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.city?.toLowerCase().includes(q) ||
      a.kecamatan?.toLowerCase().includes(q)
    );
  });

  const handleCreate = useCallback(async (data) => {
    try {
      await createServiceArea(data);
      addToast('Area layanan berhasil ditambahkan');
      await fetchAreas();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal menambahkan area';
      addToast(msg, 'error');
      return { success: false, message: msg };
    }
  }, [fetchAreas, addToast]);

  const handleUpdate = useCallback(async (id, data) => {
    try {
      await updateServiceArea(id, data);
      addToast('Area layanan berhasil diperbarui');
      await fetchAreas();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal memperbarui area';
      addToast(msg, 'error');
      return { success: false, message: msg };
    }
  }, [fetchAreas, addToast]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteServiceArea(id);
      addToast('Area layanan berhasil dihapus');
      await fetchAreas();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal menghapus area';
      addToast(msg, 'error');
      return { success: false, message: msg };
    }
  }, [fetchAreas, addToast]);

  const handleToggleActive = useCallback(async (id, currentIsActive) => {
    return handleUpdate(id, { isActive: !currentIsActive });
  }, [handleUpdate]);

  return {
    areas: filteredAreas,
    isLoading,
    error,
    search,
    setSearch,
    refetch: fetchAreas,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleActive,
  };
}
