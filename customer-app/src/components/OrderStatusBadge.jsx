const STATUS_MAP = {
  PENDING: {
    label: 'Menunggu',
    className: 'bg-straw-yellow text-barn-brown',
  },
  CONFIRMED: {
    label: 'Dikonfirmasi',
    className: 'bg-egg-yolk text-white',
  },
  PROCESSING: {
    label: 'Diproses',
    className: 'bg-egg-yolk text-white',
  },
  SHIPPED: {
    label: 'Dikirim',
    className: 'bg-blue-100 text-blue-700',
  },
  DELIVERED: {
    label: 'Selesai',
    className: 'bg-fresh-green/10 text-fresh-green',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    className: 'bg-alert-red/10 text-alert-red',
  },
};

export default function OrderStatusBadge({ status }) {
  const config = STATUS_MAP[status] || {
    label: status || 'UNKNOWN',
    className: 'bg-neutral-100 text-neutral-500',
  };

  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
}
