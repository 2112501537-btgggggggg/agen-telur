import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CategoryFormDialog({ open, onOpenChange, mode, initialData, onSubmit }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setName(initialData.name || '');
      } else {
        setName('');
      }
      setError('');
    }
  }, [open, mode, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Nama kategori wajib diisi');
      return;
    }
    if (trimmed.length < 3) {
      setError('Nama kategori minimal 3 karakter');
      return;
    }
    setError('');
    setIsSubmitting(true);
    const success = await onSubmit({ name: trimmed });
    setIsSubmitting(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium text-foreground mb-1.5">
              Nama Kategori <span className="text-alert-red">*</span>
            </label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Masukkan nama kategori"
              disabled={isSubmitting}
              className={error ? 'border-alert-red focus-visible:ring-alert-red/20' : ''}
            />
            {error && (
              <p className="text-xs text-alert-red mt-1">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-egg-yolk text-white hover:bg-warm-amber"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
