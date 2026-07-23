import { useState, useCallback, useEffect } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api/supplier.api';
import { useToast } from '../context/ToastContext';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getSuppliers();
      setSuppliers(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat data supplier');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const handleCreate = useCallback(async (data) => {
    try {
      await createSupplier(data);
      addToast('Supplier berhasil ditambahkan');
      await fetchSuppliers();
      return true;
    } catch (err) {
      addToast(err?.response?.data?.message || 'Gagal menambahkan supplier', 'error');
      return false;
    }
  }, [fetchSuppliers, addToast]);

  const handleUpdate = useCallback(async (id, data) => {
    try {
      await updateSupplier(id, data);
      addToast('Supplier berhasil diperbarui');
      await fetchSuppliers();
      return true;
    } catch (err) {
      addToast(err?.response?.data?.message || 'Gagal memperbarui supplier', 'error');
      return false;
    }
  }, [fetchSuppliers, addToast]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteSupplier(id);
      addToast('Supplier berhasil dihapus');
      await fetchSuppliers();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal menghapus supplier';
      addToast(msg, 'error');
      return { success: false, message: msg };
    }
  }, [fetchSuppliers, addToast]);

  return { suppliers, isLoading, error, refetch: fetchSuppliers, handleCreate, handleUpdate, handleDelete };
}
