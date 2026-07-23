import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useOrderDetail } from '../hooks/useOrderDetail';
import { OrderStatusBadge, PaymentStatusBadge, PaymentMethodBadge } from '../components/order/OrderStatusBadge';
import OrderItemsTable from '../components/order/OrderItemsTable';
import UpdateStatusControl from '../components/order/UpdateStatusControl';
import CancelOrderDialog from '../components/order/CancelOrderDialog';
import ConfirmCodDialog from '../components/order/ConfirmCodDialog';
import { Button } from '@/components/ui/button';

function formatCurrency(amount) {
  if (amount == null) return 'Rp0';
  return `Rp${Number(amount).toLocaleString('id-ID')}`;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    order,
    isLoading,
    error,
    actionLoading,
    handleUpdateStatus,
    handleCancel,
    handleConfirmCod,
    getValidNextStatuses,
    canCancel,
    canConfirmCod,
  } = useOrderDetail(id);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [codOpen, setCodOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-500">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/pesanan')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!order) return null;

  const validNextStatuses = getValidNextStatuses();
  const address = order.address;
  const user = order.user;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/pesanan')}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Pesanan
        </button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{order.orderNumber}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Dipesan {order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : '-'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
          <PaymentMethodBadge method={order.paymentType} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Item Pesanan</h3>
            <OrderItemsTable
              items={order.items}
              subtotalAmount={order.subtotalAmount}
              discountAmount={order.discountAmount}
              totalAmount={order.totalAmount}
            />
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Aksi</h3>

            {validNextStatuses.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Ubah Status:</p>
                <UpdateStatusControl
                  currentStatus={order.status}
                  validNextStatuses={validNextStatuses}
                  onUpdate={handleUpdateStatus}
                  isSubmitting={actionLoading === 'updateStatus'}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {canConfirmCod() && (
                <Button
                  variant="outline"
                  onClick={() => setCodOpen(true)}
                  disabled={!!actionLoading}
                >
                  Konfirmasi Pembayaran COD
                </Button>
              )}
              {canCancel() && (
                <Button
                  variant="destructive"
                  onClick={() => setCancelOpen(true)}
                  disabled={!!actionLoading}
                >
                  Batalkan Pesanan
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Customer</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nama: </span>
                <span className="font-medium">{user?.name || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Telepon: </span>
                <span className="font-medium">{user?.phone || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{user?.email || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Alamat Pengiriman</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{address?.label || 'Alamat Utama'}</p>
              {address?.recipientName && <p>Penerima: {address.recipientName}</p>}
              {address?.phone && <p>Telp: {address.phone}</p>}
              {address?.address && <p>{address.address}</p>}
              {address?.district && <p>{address.district}, {address.city}</p>}
              {address?.province && <p>{address.province} {address.postalCode}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Ringkasan Pembayaran</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Berat Total</span>
                <span>{order.totalWeightKg != null ? `${order.totalWeightKg} kg` : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotalAmount)}</span>
              </div>
              {(order.discountAmount != null && order.discountAmount > 0) && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CancelOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={handleCancel}
        isSubmitting={actionLoading === 'cancel'}
      />
      <ConfirmCodDialog
        open={codOpen}
        onOpenChange={setCodOpen}
        onConfirm={handleConfirmCod}
        isSubmitting={actionLoading === 'confirmCod'}
      />
    </div>
  );
}
