import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import CategoryFilter from '../components/CategoryFilter';
import ProductCard from '../components/ProductCard';
import { listCategories } from '../api/categories.api';
import { listProducts } from '../api/products.api';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Ambil categories sekali saat mount
  useEffect(() => {
    listCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Ambil products setiap filter/page berubah
  useEffect(() => {
    setIsLoading(true);
    listProducts({ categoryId: activeCategoryId, search: searchQuery, page, limit: 12 })
      .then((res) => {
        const data = res.data || res;
        // Handle both paginated and non-paginated responses
        const items = data.products || data.data || data || [];
        setProducts(Array.isArray(items) ? items : []);
        if (data.totalPages) setTotalPages(data.totalPages);
        else if (data.meta?.totalPages) setTotalPages(data.meta.totalPages);
        else setTotalPages(1);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setIsLoading(false));
  }, [activeCategoryId, searchQuery, page]);

  const handleSearchSubmit = useCallback((value) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handleCategorySelect = useCallback((id) => {
    setActiveCategoryId(id);
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-fresh-cream">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelect={handleCategorySelect}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <p className="text-neutral-500 text-lg">Memuat...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-6xl mb-4">📭</span>
            <p className="text-barn-brown text-lg font-medium">
              Belum ada produk di kategori ini
            </p>
            <p className="text-neutral-400 text-sm mt-1">
              Coba pilih kategori lain atau ubah kata kunci pencarian
            </p>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-barn-brown text-barn-brown hover:bg-straw-yellow transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-neutral-500">
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-barn-brown text-barn-brown hover:bg-straw-yellow transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
