import { useState } from 'react';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SupplierFormDialog from './SupplierFormDialog';
import DeleteSupplierDialog from './DeleteSupplierDialog';
import { useSuppliers } from '@/hooks/useSuppliers';

function TableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 border-b animate-pulse flex items-center px-4 gap-4">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="ml-auto flex gap-2">
            <div className="size-7 bg-muted rounded" />
            <div className="size-7 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-16">
      <h3 className="text-lg font-semibold text-barn-brown mb-1">Belum ada supplier</h3>
      <p className="text-sm text-neutral-gray mb-4">Tambahkan supplier pertama untuk mencatat stok masuk.</p>
      <Button onClick={onAdd} className="bg-egg-yolk text-white hover:bg-warm-amber">+ Tambah Supplier Pertama</Button>
    </div>
  );
}

export default function SupplierTab() {
  const { suppliers, isLoading, error, handleCreate, handleUpdate, handleDelete } = useSuppliers();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleAdd = () => { setFormMode('create'); setSelected(null); setFormOpen(true); };
  const handleEdit = (s) => { setFormMode('edit'); setSelected(s); setFormOpen(true); };
  const handleDeleteClick = (s) => { setDeleteTarget(s); setDeleteOpen(true); };

  if (error) return <div className="text-center py-8"><p className="text-alert-red text-sm">{error}</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd} className="bg-egg-yolk text-white hover:bg-warm-amber">+ Tambah Supplier</Button>
      </div>

      {isLoading ? <TableSkeleton /> : suppliers.length === 0 ? <EmptyState onAdd={handleAdd} /> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.contact}</TableCell>
                <TableCell className="text-neutral-gray">{s.address || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(s)} className="text-neutral-gray hover:text-egg-yolk"><PencilIcon className="size-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteClick(s)} className="text-neutral-gray hover:text-alert-red"><Trash2Icon className="size-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <SupplierFormDialog open={formOpen} onOpenChange={setFormOpen} mode={formMode} initialData={selected} onSubmit={formMode === 'edit' ? (d) => handleUpdate(selected.id, d) : handleCreate} />
      <DeleteSupplierDialog open={deleteOpen} onOpenChange={setDeleteOpen} supplier={deleteTarget} onConfirm={handleDelete} />
    </div>
  );
}
