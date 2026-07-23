import { Badge } from '@/components/ui/badge';

const statusConfig = {
  PENDING:     { label: 'Menunggu',   className: 'bg-amber-100 text-amber-800' },
  CONFIRMED:   { label: 'Dikonfirmasi', className: 'bg-blue-100 text-blue-800' },
  PROCESSING:  { label: 'Diproses',    className: 'bg-indigo-100 text-indigo-800' },
  SHIPPED:     { label: 'Dikirim',     className: 'bg-purple-100 text-purple-800' },
  DELIVERED:   { label: 'Selesai',     className: 'bg-green-100 text-green-800' },
  CANCELLED:   { label: 'Dibatalkan',  className: 'bg-red-100 text-red-800' },
};

const paymentStatusConfig = {
  UNPAID:  { label: 'Belum Bayar', className: 'bg-red-100 text-red-800' },
  PENDING: { label: 'Menunggu',    className: 'bg-amber-100 text-amber-800' },
  PAID:    { label: 'Lunas',       className: 'bg-green-100 text-green-800' },
  FAILED:  { label: 'Gagal',       className: 'bg-red-100 text-red-800' },
};

const paymentMethodConfig = {
  MIDTRANS: { label: 'Midtrans', className: 'bg-blue-100 text-blue-800' },
  COD:      { label: 'COD',      className: 'bg-orange-100 text-orange-800' },
};

export function OrderStatusBadge({ status }) {
  const config = statusConfig[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;
  return <Badge className={config.className}>{config.label}</Badge>;
}

export function PaymentStatusBadge({ status }) {
  const config = paymentStatusConfig[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;
  return <Badge className={config.className}>{config.label}</Badge>;
}

export function PaymentMethodBadge({ method }) {
  const config = paymentMethodConfig[method];
  if (!config) return <Badge variant="outline">{method}</Badge>;
  return <Badge className={config.className}>{config.label}</Badge>;
}
