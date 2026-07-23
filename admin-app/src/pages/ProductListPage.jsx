import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/product/ProductCard';
import ProductFilterBar from '@/components/product/ProductFilterBar';
import DeleteProductDialog from '@/components/product/DeleteProductDialog';
import { useProducts } from '@/hooks/useProducts';

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border overflow-hidden animate-pulse">
          <div className="aspect-square bg-slate-100" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-3 w-40 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center size-16 rounded-full bg-straw-yellow/50 mb-4">
        <svg className="size-8 text-barn-brown/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-barn-brown mb-1">Belum ada produk</h3>
      <p className="text-sm text-neutral-gray mb-4">Tambahkan produk pertama untuk mulai berjualan.</p>
      <Button onClick={onAdd} className="bg-egg-yolk text-white hover:bg-warm-amber">
        + Tambah Produk Pertama
      </Button>
    </div>
  );
}

export default function ProductListPage() {
  const navigate = useNavigate();
  const { products, isLoading, error, filters, setFilters, refetch, handleDelete } = useProducts();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleEdit = (product) => navigate(`/produk/${product.id}/edit`);
  const handleDeleteClick = (product) => { setDeleteTarget(product); setDeleteOpen(true); };

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-alert-red text-sm mb-3">{error}</p>
        <Button onClick={refetch} className="bg-egg-yolk text-white hover:bg-warm-amber">Coba lagi</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Kelola Produk</h2>
        <Button onClick={() => navigate('/produk/tambah')} className="bg-egg-yolk text-white hover:bg-warm-amber self-start">
          + Tambah Produk
        </Button>
      </div>

      <ProductFilterBar filters={filters} onFilterChange={setFilters} />

      {isLoading ? (
        <ListSkeleton />
      ) : products.length === 0 ? (
        <EmptyState onAdd={() => navigate('/produk/tambah')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <DeleteProductDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        product={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
