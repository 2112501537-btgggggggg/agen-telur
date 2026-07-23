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

export default function CancelOrderDialog({ open, onOpenChange, onConfirm, isSubmitting }) {
  const handleConfirm = async () => {
    const result = await onConfirm();
    if (result?.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batalkan Pesanan</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Apakah Anda yakin ingin membatalkan pesanan ini? Stok varian terkait akan dikembalikan secara otomatis.
        </p>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Membatalkan...' : 'Ya, Batalkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
