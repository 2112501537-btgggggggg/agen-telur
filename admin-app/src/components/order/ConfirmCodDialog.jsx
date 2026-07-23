import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ConfirmCodDialog({ open, onOpenChange, onConfirm, isSubmitting }) {
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
          <DialogTitle>Konfirmasi Pembayaran COD</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Konfirmasi bahwa pembayaran tunai untuk pesanan ini telah diterima. Status pembayaran akan diubah menjadi <strong>Lunas</strong>.
        </p>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Mengonfirmasi...' : 'Ya, Konfirmasi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
