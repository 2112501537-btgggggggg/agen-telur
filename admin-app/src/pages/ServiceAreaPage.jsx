import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useServiceAreas } from '../hooks/useServiceAreas';
import ServiceAreaTable from '../components/service-area/ServiceAreaTable';
import ServiceAreaFormDialog from '../components/service-area/ServiceAreaFormDialog';
import DeleteServiceAreaDialog from '../components/service-area/DeleteServiceAreaDialog';
import { Button } from '@/components/ui/button';

export default function ServiceAreaPage() {
  const {
    areas,
    isLoading,
    error,
    search,
    setSearch,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleActive,
  } = useServiceAreas();

  const [formOpen, setFormOpen] = useState(false);
  const [editArea, setEditArea] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteArea, setDeleteArea] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSubmit = async (data) => {
    setIsSubmitting(true);
    const result = await handleCreate(data);
    setIsSubmitting(false);
    return result;
  };

  const handleEditSubmit = async (data) => {
    if (!editArea) return;
    setIsSubmitting(true);
    const result = await handleUpdate(editArea.id, data);
    setIsSubmitting(false);
    return result;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteArea) return;
    setIsSubmitting(true);
    const result = await handleDelete(deleteArea.id);
    setIsSubmitting(false);
    return result;
  };

  const handleEdit = (area) => {
    setEditArea(area);
    setFormOpen(true);
  };

  const handleDeleteClick = (area) => {
    setDeleteArea(area);
    setDeleteOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditArea(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Service Area</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola daftar kota/kecamatan yang dilayani</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={16} className="mr-1" /> Tambah Area
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      <ServiceAreaTable
        areas={areas}
        search={search}
        onSearchChange={setSearch}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onToggleActive={handleToggleActive}
      />

      <ServiceAreaFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        onSubmit={editArea ? handleEditSubmit : handleCreateSubmit}
        isSubmitting={isSubmitting}
        initialData={editArea}
      />

      <DeleteServiceAreaDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteConfirm}
        isSubmitting={isSubmitting}
        area={deleteArea}
      />
    </div>
  );
}
