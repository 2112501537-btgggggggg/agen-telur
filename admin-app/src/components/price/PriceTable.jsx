import { useState } from 'react';
import { HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PriceEditableCell from './PriceEditableCell';
import PriceHistorySheet from './PriceHistorySheet';

function TableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 border-b animate-pulse flex items-center px-4 gap-4">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-32" />
          <div className="ml-auto h-6 w-6 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center size-16 rounded-full bg-straw-yellow/50 mb-4">
        <svg className="size-8 text-barn-brown/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-barn-brown mb-1">Belum ada varian produk</h3>
      <p className="text-sm text-neutral-gray">Buat produk dengan varian terlebih dahulu di menu Produk.</p>
    </div>
  );
}

export default function PriceTable({ variants, isLoading, onUpdatePrice }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyVariant, setHistoryVariant] = useState(null);
  const [highlightId, setHighlightId] = useState(null);

  const handleSave = async (variantId, newPrice, variantLabel) => {
    const result = await onUpdatePrice(variantId, newPrice, variantLabel);
    if (result.success) {
      setHighlightId(variantId);
      setTimeout(() => setHighlightId(null), 2000);
    }
    return result;
  };

  const openHistory = (variant) => {
    setHistoryVariant(variant);
    setHistoryOpen(true);
  };

  if (isLoading) return <TableSkeleton />;
  if (variants.length === 0) return <EmptyState />;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead className="w-20">Grade</TableHead>
            <TableHead className="w-40">Harga Saat Ini</TableHead>
            <TableHead className="w-44">Terakhir Diubah</TableHead>
            <TableHead className="w-16 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((v) => {
            const variantLabel = `${v.product?.name} (${v.grade})`;
            return (
              <TableRow
                key={v.id}
                className={highlightId === v.id ? 'bg-straw-yellow/30 transition-colors duration-2000' : ''}
              >
                <TableCell className="font-medium">{v.product?.name || '-'}</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-straw-yellow text-barn-brown">
                    {v.grade}
                  </span>
                </TableCell>
                <TableCell>
                  <PriceEditableCell
                    value={v.pricePerKg}
                    onSave={(val) => handleSave(v.id, val, variantLabel)}
                    variantLabel={variantLabel}
                  />
                </TableCell>
                <TableCell className="text-sm text-neutral-gray">
                  {v.lastPriceUpdateAt
                    ? new Date(v.lastPriceUpdateAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openHistory(v)}
                    className="text-neutral-gray hover:text-egg-yolk"
                    title="Riwayat Harga"
                  >
                    <HistoryIcon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <PriceHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        variant={historyVariant}
      />
    </>
  );
}
