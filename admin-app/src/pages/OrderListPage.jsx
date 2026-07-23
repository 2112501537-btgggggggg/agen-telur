import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useOrders } from '../hooks/useOrders';
import OrderFilterBar from '../components/order/OrderFilterBar';
import { OrderStatusBadge, PaymentStatusBadge, PaymentMethodBadge } from '../components/order/OrderStatusBadge';

function formatCurrency(amount) {
  if (amount == null) return 'Rp0';
  return `Rp${Number(amount).toLocaleString('id-ID')}`;
}

export default function OrderListPage() {
  const { orders, isLoading, error, filters, updateFilter, resetFilters, refetch } = useOrders();
  const navigate = useNavigate();

  const isPendingCod = (o) => o.paymentType === 'COD' && o.paymentStatus === 'UNPAID';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Kelola Pesanan</h2>
        <p className="text-sm text-slate-500 mt-1">Lihat dan kelola semua pesanan masuk</p>
      </div>

      <OrderFilterBar
        filters={filters}
        onUpdateFilter={updateFilter}
        onReset={resetFilters}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">No. Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Metode Bayar</th>
                <th className="px-4 py-3 font-medium">Status Bayar</th>
                <th className="px-4 py-3 font-medium">Status Order</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Memuat data...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Tidak ada pesanan ditemukan
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`border-b last:border-0 hover:bg-slate-50 transition-colors ${
                      isPendingCod(order) ? 'bg-amber-50/60' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {order.orderNumber}
                      {isPendingCod(order) && (
                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </td>
                    <td className="px-4 py-3">{order.user?.name || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3"><PaymentMethodBadge method={order.paymentType} /></td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={order.paymentStatus} /></td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.createdAt
                        ? format(new Date(order.createdAt), 'dd MMM yyyy', { locale: idLocale })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/pesanan/${order.id}`)}
                        className="text-egg-yolk hover:text-warm-amber text-sm font-medium"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
