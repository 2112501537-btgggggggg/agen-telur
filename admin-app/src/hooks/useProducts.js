import { useState, useCallback, useEffect } from 'react';
import { getAdminProducts, getProductById, createProduct, updateProduct, deleteProduct, addVariant } from '../api/product.api';
import { useToast } from '../context/ToastContext';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ categoryId: '', search: '' });
  const { addToast } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.categoryId) params.categoryId = filters.categoryId;
      const res = await getAdminProducts(params);
      let data = res.data || [];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        data = data.filter((p) => p.name.toLowerCase().includes(q));
      }
      setProducts(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat data produk');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteProduct(id);
      addToast('Produk berhasil dihapus');
      await fetchProducts();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal menghapus produk';
      addToast(msg, 'error');
      return { success: false, message: msg };
    }
  }, [fetchProducts, addToast]);

  return {
    products,
    isLoading,
    error,
    filters,
    setFilters,
    refetch: fetchProducts,
    handleDelete,
  };
}

export function useProductForm(productId) {
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(!!productId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setIsLoading(true);
    getProductById(productId)
      .then((res) => {
        if (!cancelled) setProduct(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || 'Gagal memuat data produk');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId]);

  useEffect(() => {
    let cancelled = false;
    import('../api/category.api').then(({ getCategories }) => {
      getCategories().then((res) => {
        if (!cancelled) setCategories(res.data || []);
      });
    });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = useCallback(async (formData, existingVariants) => {
    setIsSubmitting(true);
    setError(null);
    try {
      let savedProduct;
      if (productId) {
        const res = await updateProduct(productId, formData);
        savedProduct = res.data;
      } else {
        const res = await createProduct(formData);
        savedProduct = res.data;
      }
      if (existingVariants && existingVariants.length > 0) {
        for (const v of existingVariants) {
          if (v.pricePerKg > 0) {
            await addVariant(savedProduct.id, {
              grade: v.grade,
              pricePerKg: v.pricePerKg,
              stockKg: v.stockKg || 0,
              lowStockThreshold: v.lowStockThreshold || 10,
            });
          }
        }
      }
      addToast(productId ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan');
      return { success: true, product: savedProduct };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal menyimpan produk';
      setError(msg);
      addToast(msg, 'error');
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  }, [productId, addToast]);

  return {
    product,
    categories,
    isLoading,
    isSubmitting,
    error,
    handleSubmit,
  };
}
