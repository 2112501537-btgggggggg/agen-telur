import { useState, useEffect, useMemo } from 'react';
import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CategoryTable from '@/components/category/CategoryTable';
import CategoryFormDialog from '@/components/category/CategoryFormDialog';
import DeleteCategoryDialog from '@/components/category/DeleteCategoryDialog';
import { useCategories } from '@/hooks/useCategories';

export default function CategoryPage() {
  const { categories, isLoading, error, refetch, handleCreate, handleUpdate, handleDelete } = useCategories();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const handleAdd = () => {
    setFormMode('create');
    setSelectedCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (cat) => {
    setFormMode('edit');
    setSelectedCategory(cat);
    setFormOpen(true);
  };

  const handleDeleteClick = (cat) => {
    setDeleteCategory(cat);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    if (formMode === 'edit' && selectedCategory) {
      return handleUpdate(selectedCategory.id, data);
    }
    return handleCreate(data);
  };

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-alert-red text-sm mb-3">{error}</p>
        <Button onClick={refetch} className="bg-egg-yolk text-white hover:bg-warm-amber">
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Kelola Kategori</h2>
        <Button
          onClick={handleAdd}
          className="bg-egg-yolk text-white hover:bg-warm-amber self-start"
        >
          + Tambah Kategori
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-gray" />
          <Input
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <CategoryTable
        categories={filtered}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onAdd={handleAdd}
      />

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={selectedCategory}
        onSubmit={handleFormSubmit}
      />

      <DeleteCategoryDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        category={deleteCategory}
        onConfirm={handleDelete}
      />
    </div>
  );
}
