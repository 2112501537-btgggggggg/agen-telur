import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ServiceAreaFormDialog({ open, onOpenChange, onSubmit, isSubmitting, initialData }) {
  const [city, setCity] = useState(initialData?.city || '');
  const [kecamatan, setKecamatan] = useState(initialData?.kecamatan || '');

  const isEdit = !!initialData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    const result = await onSubmit({ city: city.trim(), kecamatan: kecamatan.trim() || null });
    if (result?.success) {
      setCity('');
      setKecamatan('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Area Layanan' : 'Tambah Area Layanan'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kota/Kabupaten <span className="text-red-500">*</span></label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Contoh: Bandung"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kecamatan</label>
            <Input
              value={kecamatan}
              onChange={(e) => setKecamatan(e.target.value)}
              placeholder="Kosongkan untuk mencakup seluruh kota"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Batal</DialogClose>
            <Button type="submit" disabled={isSubmitting || !city.trim()}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
