import { useState, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/category.api';
import { useToast } from '../context/ToastContext';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCategories();
      setCategories(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat data kategori');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreate = useCallback(async (data) => {
    try {
      await createCategory(data);
      addToast('Kategori berhasil ditambahkan');
      await fetchCategories();
      return true;
    } catch (err) {
      addToast(err?.response?.data?.message || 'Gagal menambahkan kategori', 'error');
      return false;
    }
  }, [fetchCategories, addToast]);

  const handleUpdate = useCallback(async (id, data) => {
    try {
      await updateCategory(id, data);
      addToast('Kategori berhasil diperbarui');
      await fetchCategories();
      return true;
    } catch (err) {
      addToast(err?.response?.data?.message || 'Gagal memperbarui kategori', 'error');
      return false;
    }
  }, [fetchCategories, addToast]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteCategory(id);
      addToast('Kategori berhasil dihapus');
      await fetchCategories();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal menghapus kategori';
      addToast(msg, 'error');
      return { success: false, message: msg };
    }
  }, [fetchCategories, addToast]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
