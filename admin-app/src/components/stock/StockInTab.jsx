import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StockInFormDialog from './StockInFormDialog';
import { useStockIns } from '@/hooks/useStockIns';
import { formatRupiah } from '@/lib/format';

function TableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 border-b animate-pulse flex items-center px-4 gap-4">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-semibold text-barn-brown mb-1">Belum ada stok masuk</h3>
      <p className="text-sm text-neutral-gray">Catat stok masuk pertama dari supplier.</p>
    </div>
  );
}

export default function StockInTab() {
  const { stockIns, isLoading, handleCreate } = useStockIns();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)} className="bg-egg-yolk text-white hover:bg-warm-amber">+ Catat Stok Masuk</Button>
      </div>

      {isLoading ? <TableSkeleton /> : stockIns.length === 0 ? <EmptyState /> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Produk & Grade</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Harga Beli</TableHead>
              <TableHead>Dicatat Oleh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockIns.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-sm">{new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                <TableCell className="font-medium">{s.variant?.product?.name} <span className="text-xs text-neutral-gray">({s.variant?.grade})</span></TableCell>
                <TableCell>{s.supplier?.name}</TableCell>
                <TableCell>{s.quantityKg} kg</TableCell>
                <TableCell>{formatRupiah(s.pricePerKg)}/kg</TableCell>
                <TableCell className="text-neutral-gray text-sm">{s.createdBy || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <StockInFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
    </div>
  );
}
