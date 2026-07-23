import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StockAdjustmentFormDialog from './StockAdjustmentFormDialog';
import { useStockAdjustments } from '@/hooks/useStockAdjustments';
import { getAdminProducts } from '../../api/product.api';

function EmptyState() {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-semibold text-barn-brown mb-1">Belum ada adjustment stok</h3>
      <p className="text-sm text-neutral-gray">Catat adjustment stok pertama untuk koreksi inventaris.</p>
    </div>
  );
}

export default function StockAdjustmentTab() {
  const { adjustments, isLoading, fetchAdjustments, handleCreate } = useStockAdjustments();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  const handleViewHistory = async () => {
    if (!selectedVariantId) return;
    await fetchAdjustments(selectedVariantId);
  };

  const handleOpenForm = async () => {
    const res = await getAdminProducts();
    setProducts(res.data || []);
    setFormOpen(true);
  };

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const variants = selectedProduct?.variants || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium mb-1.5">Lihat Riwayat Adjustment</label>
          <div className="flex gap-2">
            <select value={selectedProductId} onChange={(e) => { setSelectedProductId(e.target.value); setSelectedVariantId(null); }} className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring">
              <option value="">Pilih Produk</option>
              {products.length === 0 && <option value="" disabled>Memuat...</option>}
              {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
            {selectedProductId && variants.length > 0 && (
              <select value={selectedVariantId || ''} onChange={(e) => setSelectedVariantId(Number(e.target.value))} className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring">
                <option value="">Pilih Grade</option>
                {variants.map((v) => (<option key={v.id} value={v.id}>{v.grade}</option>))}
              </select>
            )}
            <Button onClick={handleViewHistory} disabled={!selectedVariantId} variant="outline" className="h-8">Lihat</Button>
          </div>
        </div>
        <Button onClick={handleOpenForm} className="bg-egg-yolk text-white hover:bg-warm-amber whitespace-nowrap">+ Catat Adjustment</Button>
      </div>

      {!selectedVariantId && !isLoading && <EmptyState />}

      {selectedVariantId && !isLoading && adjustments.length === 0 && (
        <div className="text-center py-8 text-sm text-neutral-gray">Belum ada riwayat adjustment untuk varian ini.</div>
      )}

      {isLoading ? (
        <div className="border rounded-lg overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 border-b animate-pulse flex items-center px-4 gap-4">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-4 bg-muted rounded w-16" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : adjustments.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead>Dicatat Oleh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.map((a) => {
              const isDecrease = Number(a.changeKg) < 0;
              return (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">{new Date(a.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${isDecrease ? 'bg-alert-red/10 text-alert-red' : 'bg-fresh-green/10 text-fresh-green'}`}>
                      {isDecrease ? 'Kurangi' : 'Tambah'}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{Math.abs(Number(a.changeKg))} kg</TableCell>
                  <TableCell className="text-neutral-gray text-sm max-w-xs truncate">{a.reason}</TableCell>
                  <TableCell className="text-neutral-gray text-sm">{a.user?.name || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <StockAdjustmentFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
    </div>
  );
}
