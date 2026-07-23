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
import { OrderStatusBadge } from './OrderStatusBadge';

const STATUS_LABELS = {
  CONFIRMED: 'Dikonfirmasi',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  DELIVERED: 'Selesai',
};

export default function UpdateStatusControl({ currentStatus, validNextStatuses, onUpdate, isSubmitting }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  if (!validNextStatuses || validNextStatuses.length === 0) return null;

  const handleConfirm = async () => {
    if (!selected) return;
    const result = await onUpdate(selected);
    if (result?.success) {
      setOpen(false);
      setSelected(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {validNextStatuses.map((s) => (
          <Button
            key={s}
            variant="outline"
            size="sm"
            onClick={() => { setSelected(s); setOpen(true); }}
            disabled={isSubmitting}
          >
            Ubah ke {STATUS_LABELS[s] || s}
          </Button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Ubah Status</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ubah status dari <OrderStatusBadge status={currentStatus} /> menjadi <OrderStatusBadge status={selected} />?
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
            <Button onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Ya, Ubah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
