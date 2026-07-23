import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon } from 'lucide-react';

export default function DeleteSupplierDialog({ open, onOpenChange, supplier, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleConfirm = async () => {
    setIsDeleting(true);
    setErrorMsg('');
    const result = await onConfirm(supplier.id);
    setIsDeleting(false);
    if (result.success) onOpenChange(false);
    else setErrorMsg(result.message);
  };

  return (
    <Dialog open={open} onOpenChange={() => { setErrorMsg(''); onOpenChange(false); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-alert-red/10">
              <AlertTriangleIcon className="size-5 text-alert-red" />
            </div>
            <DialogTitle>Hapus Supplier</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus supplier <span className="font-semibold text-foreground">&apos;{supplier?.name}&apos;</span>?
          </p>
          {errorMsg && (
            <div className="p-3 rounded-lg bg-alert-red/10 border border-alert-red/20">
              <p className="text-sm text-alert-red">{errorMsg}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>Batal</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting} className="bg-alert-red text-white hover:bg-alert-red/90">
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
