import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SupplierFormDialog({ open, onOpenChange, mode, initialData, onSubmit }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setName(initialData.name || '');
        setContact(initialData.contact || '');
        setAddress(initialData.address || '');
      } else {
        setName('');
        setContact('');
        setAddress('');
      }
      setErrors({});
    }
  }, [open, mode, initialData]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Nama supplier wajib diisi';
    if (!contact.trim()) errs.contact = 'Kontak supplier wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const data = { name: name.trim(), contact: contact.trim(), address: address.trim() || null };
    const success = await onSubmit(data);
    setIsSubmitting(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Supplier' : 'Tambah Supplier'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Supplier <span className="text-alert-red">*</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama supplier" disabled={isSubmitting} className={errors.name ? 'border-alert-red' : ''} />
            {errors.name && <p className="text-xs text-alert-red mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Kontak <span className="text-alert-red">*</span></label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="No. telepon/WA" disabled={isSubmitting} className={errors.contact ? 'border-alert-red' : ''} />
            {errors.contact && <p className="text-xs text-alert-red mt-1">{errors.contact}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Alamat</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat (opsional)" rows={2} disabled={isSubmitting} className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none" />
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
