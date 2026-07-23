import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function TableSkeleton() {
  return (
    <div className="w-full">
      <div className="border rounded-lg overflow-hidden">
        <div className="h-10 bg-muted/50 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 border-t animate-pulse flex items-center px-4 gap-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="ml-auto flex gap-2">
              <div className="size-7 bg-muted rounded" />
              <div className="size-7 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
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
      <h3 className="text-lg font-semibold text-barn-brown mb-1">Belum ada kategori</h3>
      <p className="text-sm text-neutral-gray mb-4">Tambahkan kategori pertama untuk mulai mengelola produk.</p>
      <Button onClick={onAdd} className="bg-egg-yolk text-white hover:bg-warm-amber">
        + Tambah Kategori Pertama
      </Button>
    </div>
  );
}

export default function CategoryTable({ categories, isLoading, onEdit, onDelete, onAdd }) {
  if (isLoading) return <TableSkeleton />;
  if (categories.length === 0) return <EmptyState onAdd={onAdd} />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">No</TableHead>
          <TableHead>Nama Kategori</TableHead>
          <TableHead className="w-24 text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((cat, idx) => (
          <TableRow key={cat.id}>
            <TableCell className="text-neutral-gray">{idx + 1}</TableCell>
            <TableCell className="font-medium">{cat.name}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(cat)}
                  className="text-neutral-gray hover:text-egg-yolk"
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(cat)}
                  className="text-neutral-gray hover:text-alert-red"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
