import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', className: 'bg-straw-yellow text-barn-brown' },
  CONFIRMED: { label: 'Dikonfirmasi', className: 'bg-egg-yolk text-white' },
  PROCESSING: { label: 'Diproses', className: 'bg-egg-yolk text-white' },
  SHIPPED: { label: 'Dikirim', className: 'bg-[#5B9BD5] text-white' },
  DELIVERED: { label: 'Selesai', className: 'bg-fresh-green text-white' },
  CANCELLED: { label: 'Dibatalkan', className: 'bg-alert-red text-white' },
};

export default function OrdersByStatusSection({ ordersByStatus }) {
  if (!ordersByStatus) return null;

  const entries = Object.entries(ordersByStatus);
  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="font-semibold text-slate-800 mb-4">Pesanan per Status</h3>
      <div className="flex flex-wrap gap-3">
        {entries.map(([status, count]) => {
          const config = STATUS_CONFIG[status] || {
            label: status,
            className: 'bg-slate-100 text-slate-700',
          };
          return (
            <div
              key={status}
              className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2"
            >
              <Badge className={config.className}>{config.label}</Badge>
              <span className="text-lg font-bold text-slate-800">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
