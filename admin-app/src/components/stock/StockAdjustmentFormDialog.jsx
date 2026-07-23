import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAdminProducts } from '../../api/product.api';

export default function StockAdjustmentFormDialog({ open, onOpenChange, onSubmit }) {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [changeKg, setChangeKg] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      getAdminProducts().then((res) => setProducts(res.data || [])).catch(() => {});
      setSelectedProductId('');
      setSelectedVariantId('');
      setChangeKg('');
      setReason('');
      setErrors({});
    }
  }, [open]);

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const variants = selectedProduct?.variants || [];

  const validate = () => {
    const errs = {};
    if (!selectedVariantId) errs.variant = 'Pilih produk dan grade';
    if (!changeKg || isNaN(Number(changeKg)) || Number(changeKg) === 0) errs.change = 'Jumlah tidak boleh 0';
    if (!reason.trim() || reason.trim().length < 3) errs.reason = 'Alasan minimal 3 karakter';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const success = await onSubmit(Number(selectedVariantId), {
      changeKg: Number(changeKg),
      reason: reason.trim(),
    });
    setIsSubmitting(false);
    if (success) onOpenChange(false);
  };

  const isDecrease = Number(changeKg) < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Adjustment Stok</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Produk & Grade <span className="text-alert-red">*</span></label>
            <select value={selectedProductId} onChange={(e) => { setSelectedProductId(e.target.value); setSelectedVariantId(''); }} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring">
              <option value="">Pilih Produk</option>
              {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
            {selectedProductId && variants.length > 0 && (
              <select value={selectedVariantId} onChange={(e) => setSelectedVariantId(e.target.value)} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring mt-2">
                <option value="">Pilih Grade</option>
                {variants.map((v) => (<option key={v.id} value={v.id}>{v.grade} — Stok: {v.stockKg}kg</option>))}
              </select>
            )}
            {errors.variant && <p className="text-xs text-alert-red mt-1">{errors.variant}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Perubahan Stok (kg) <span className="text-alert-red">*</span></label>
            <p className="text-xs text-neutral-gray mb-1.5">Gunakan angka positif untuk tambah, negatif untuk kurangi.</p>
            <Input type="number" step="0.01" value={changeKg} onChange={(e) => setChangeKg(e.target.value)} placeholder="contoh: 50 atau -3" className={errors.change ? 'border-alert-red' : ''} />
            {errors.change && <p className="text-xs text-alert-red mt-1">{errors.change}</p>}
            {changeKg && (
              <p className={`text-xs mt-1 font-medium ${isDecrease ? 'text-alert-red' : 'text-fresh-green'}`}>
                {isDecrease ? `Mengurangi ${Math.abs(Number(changeKg))}kg` : `Menambah ${Number(changeKg)}kg`}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Alasan <span className="text-alert-red">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan penyesuaian stok..." rows={3} className={`w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none ${errors.reason ? 'border-alert-red' : 'border-input'}`} />
            {errors.reason && <p className="text-xs text-alert-red mt-1">{errors.reason}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-egg-yolk text-white hover:bg-warm-amber">
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
