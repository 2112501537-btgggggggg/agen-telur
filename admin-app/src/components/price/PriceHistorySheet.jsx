import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePriceHistory } from '@/hooks/usePriceVariants';
import { formatRupiah } from '@/lib/format';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function PriceHistorySheet({ open, onOpenChange, variant }) {
  const { history, isLoading, error, fetchHistory, clearHistory } = usePriceHistory();

  useEffect(() => {
    if (open && variant?.id) {
      fetchHistory(variant.id);
    } else if (!open) {
      clearHistory();
    }
  }, [open, variant?.id, fetchHistory, clearHistory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Riwayat Harga — {variant?.product?.name} ({variant?.grade})
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-neutral-gray">Memuat riwayat...</div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-alert-red">{error}</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-gray">Belum ada riwayat perubahan harga</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-neutral-gray">
                  <th className="py-2 pr-4 font-medium">Harga</th>
                  <th className="py-2 pr-4 font-medium">Tanggal</th>
                  <th className="py-2 font-medium">Diubah Oleh</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{formatRupiah(h.newPrice)}</td>
                    <td className="py-2 pr-4 text-neutral-gray">{formatDate(h.changedAt)}</td>
                    <td className="py-2">{h.user?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
