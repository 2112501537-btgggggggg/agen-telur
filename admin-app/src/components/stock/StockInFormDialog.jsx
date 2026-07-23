import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAdminProducts } from '../../api/product.api';
import { useSuppliers } from '../../hooks/useSuppliers';

export default function StockInFormDialog({ open, onOpenChange, onSubmit }) {
  const { suppliers } = useSuppliers();
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      getAdminProducts().then((res) => setProducts(res.data || [])).catch(() => {});
      setSelectedProductId('');
      setSelectedVariantId('');
      setSupplierId('');
      setQuantityKg('');
      setPricePerKg('');
      setErrors({});
    }
  }, [open]);

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const variants = selectedProduct?.variants || [];

  const validate = () => {
    const errs = {};
    if (!selectedVariantId) errs.variant = 'Pilih produk dan grade';
    if (!supplierId) errs.supplier = 'Pilih supplier';
    if (!quantityKg || Number(quantityKg) <= 0) errs.quantity = 'Jumlah harus lebih dari 0';
    if (!pricePerKg || Number(pricePerKg) <= 0) errs.price = 'Harga beli harus lebih dari 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const success = await onSubmit({
      productVariantId: Number(selectedVariantId),
      supplierId: Number(supplierId),
      quantityKg: Number(quantityKg),
      pricePerKg: Number(pricePerKg),
    });
    setIsSubmitting(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Stok Masuk</DialogTitle>
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
            <label className="block text-sm font-medium mb-1.5">Supplier <span className="text-alert-red">*</span></label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring">
              <option value="">Pilih Supplier</option>
              {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            {errors.supplier && <p className="text-xs text-alert-red mt-1">{errors.supplier}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Jumlah (kg) <span className="text-alert-red">*</span></label>
              <Input type="number" min="0.01" step="0.01" value={quantityKg} onChange={(e) => setQuantityKg(e.target.value)} placeholder="0" className={errors.quantity ? 'border-alert-red' : ''} />
              {errors.quantity && <p className="text-xs text-alert-red mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Harga Beli/kg <span className="text-alert-red">*</span></label>
              <Input type="number" min="1" value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)} placeholder="0" className={errors.price ? 'border-alert-red' : ''} />
              {errors.price && <p className="text-xs text-alert-red mt-1">{errors.price}</p>}
            </div>
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
