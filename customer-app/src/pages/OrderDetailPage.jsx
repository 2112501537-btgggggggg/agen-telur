import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getOrderDetail } from '../api/orders.api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import ReviewForm from '../components/ReviewForm';

const PAYMENT_TYPE_MAP = {
  COD: { label: 'COD', className: 'bg-straw-yellow text-barn-brown' },
  MIDTRANS: { label: 'Online', className: 'bg-blue-100 text-blue-700' },
};

const PAYMENT_STATUS_MAP = {
  UNPAID: { label: 'Belum Dibayar', className: 'bg-alert-red/10 text-alert-red' },
  PAID: { label: 'Lunas', className: 'bg-fresh-green/10 text-fresh-green' },
  REFUNDED: { label: 'Dikembalikan', className: 'bg-neutral-100 text-neutral-500' },
};

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function Badge({ label, className }) {
  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}
    >
      {label}
    </span>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const paymentMsg = location.state?.paymentMessage;

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasJustReviewed, setHasJustReviewed] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError('');
    getOrderDetail(id)
      .then((res) => {
        setOrder(res.data || res);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 403 || status === 404) {
          setError('Pesanan tidak ditemukan atau Anda tidak memiliki akses.');
        } else {
          setError('Gagal memuat detail pesanan.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fresh-cream">
        <p className="text-barn-brown">Memuat...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fresh-cream px-4 text-center gap-4">
        <span className="text-5xl">🔍</span>
        <p className="text-alert-red font-medium">{error || 'Pesanan tidak ditemukan'}</p>
        <Link
          to="/orders"
          className="text-egg-yolk hover:text-warm-amber font-medium"
        >
          ← Kembali ke Riwayat Pesanan
        </Link>
      </div>
    );
  }

  const payTypeConfig = PAYMENT_TYPE_MAP[order.paymentType] || {
    label: order.paymentType,
    className: 'bg-neutral-100 text-neutral-500',
  };
  const payStatusConfig = PAYMENT_STATUS_MAP[order.paymentStatus] || {
    label: order.paymentStatus,
    className: 'bg-neutral-100 text-neutral-500',
  };

  const items = order.items || [];
  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.subtotal || i.totalPrice || 0),
    0
  );
  const discount = Number(order.discountAmount || 0);
  const total = Number(order.totalAmount || subtotal - discount);

  return (
    <div className="min-h-screen bg-fresh-cream">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Back link */}
        <Link
          to="/orders"
          className="text-sm text-neutral-500 hover:text-barn-brown transition"
        >
          ← Riwayat Pesanan
        </Link>

        {/* Order header */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1
                className="text-xl font-bold text-barn-brown"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {order.orderNumber || `Pesanan #${order.id}`}
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Payment info badges */}
          <div className="flex flex-wrap gap-2">
            <Badge label={payTypeConfig.label} className={payTypeConfig.className} />
            <Badge label={payStatusConfig.label} className={payStatusConfig.className} />
          </div>

          {paymentMsg && (
            <div className="text-sm text-neutral-500 bg-straw-yellow/50 rounded-lg px-3 py-2">
              {paymentMsg}
            </div>
          )}
        </div>

        {/* Shipping address */}
        {order.address && (
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-2">
            <h2 className="font-semibold text-sm text-barn-brown">
              Alamat Pengiriman
            </h2>
            <p className="text-sm text-barn-brown font-medium">
              {order.address.label}
            </p>
            <p className="text-sm text-neutral-500">{order.address.fullAddress}</p>
            <p className="text-xs text-neutral-400">
              {order.address.kecamatan}, {order.address.city}
            </p>
          </div>
        )}

        {/* Order items */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-sm text-barn-brown">Item Pesanan</h2>
          <div className="divide-y divide-neutral-100">
            {items.map((item, idx) => {
              const productName =
                item.product?.name || item.productName || `Item #${idx + 1}`;
              const grade = item.grade || item.productVariant?.grade || '-';
              const quantity = item.quantity || 0;
              const unit = item.unit || 'KG';
              const itemSubtotal = Number(
                item.subtotal || item.totalPrice || 0
              );
              return (
                <div
                  key={item.id || idx}
                  className="flex justify-between items-center py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-barn-brown truncate">
                      {productName}
                    </p>
                    <p className="text-xs text-neutral-400">
                      Grade: {grade} | {quantity}x {unit}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-egg-yolk ml-3 shrink-0">
                    Rp{itemSubtotal.toLocaleString('id-ID')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost summary */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-sm text-barn-brown">Ringkasan Biaya</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-neutral-500">
              <span>Subtotal</span>
              <span className="font-medium text-barn-brown">
                Rp{subtotal.toLocaleString('id-ID')}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-fresh-green">Diskon Member 🎉</span>
                <span className="font-medium text-fresh-green">
                  -Rp{discount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            <hr className="border-neutral-200" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-barn-brown">Total</span>
              <span className="text-xl font-bold text-egg-yolk">
                Rp{total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Review form (only for DELIVERED) */}
        {order.status === 'DELIVERED' && !hasJustReviewed && (
          <ReviewForm
            orderId={order.id}
            onSuccess={() => setHasJustReviewed(true)}
          />
        )}

        {order.status === 'DELIVERED' && hasJustReviewed && (
          <div className="bg-fresh-green/10 rounded-xl p-5 text-center">
            <span className="text-3xl">🎉</span>
            <p className="text-fresh-green font-semibold mt-2">
              Terima kasih atas review Anda!
            </p>
          </div>
        )}

        {/* Bottom links */}
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/orders"
            className="text-egg-yolk hover:text-warm-amber text-sm font-medium transition"
          >
            ← Ke Riwayat Pesanan
          </Link>
          <Link
            to="/"
            className="text-egg-yolk hover:text-warm-amber text-sm font-medium transition"
          >
            ← Ke Home
          </Link>
        </div>
      </div>
    </div>
  );
}
