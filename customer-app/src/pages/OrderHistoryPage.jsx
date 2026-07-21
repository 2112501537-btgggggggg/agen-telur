import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listOrders } from '../api/orders.api';
import OrderStatusBadge from '../components/OrderStatusBadge';

const FILTERS = [
  { key: null, label: 'Semua' },
  { key: 'PENDING', label: 'Menunggu' },
  { key: 'CONFIRMED', label: 'Dikonfirmasi' },
  { key: 'PROCESSING', label: 'Diproses' },
  { key: 'SHIPPED', label: 'Dikirim' },
  { key: 'DELIVERED', label: 'Selesai' },
  { key: 'CANCELLED', label: 'Dibatalkan' },
];

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError('');
    const params = {};
    if (activeFilter) params.status = activeFilter;

    listOrders(params)
      .then((res) => {
        setOrders(res.data || []);
      })
      .catch(() => setError('Gagal memuat pesanan'))
      .finally(() => setIsLoading(false));
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-fresh-cream">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1
          className="text-2xl font-bold text-barn-brown"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Riwayat Pesanan
        </h1>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition border ${
                activeFilter === f.key
                  ? 'bg-egg-yolk border-egg-yolk text-white'
                  : 'bg-white border-neutral-300 text-barn-brown hover:bg-straw-yellow/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-alert-red/10 text-alert-red text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <p className="text-neutral-500">Memuat...</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <span className="text-6xl">📦</span>
            <p className="text-barn-brown font-medium">Belum ada pesanan</p>
            <p className="text-neutral-400 text-sm">Yuk, belanja dulu!</p>
            <Link
              to="/"
              className="bg-egg-yolk hover:bg-warm-amber text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Lihat Produk
            </Link>
          </div>
        )}

        {/* Order list */}
        {!isLoading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="w-full text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-barn-brown">
                      {order.orderNumber || `#${order.id}`}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {formatDate(order.createdAt)}
                    </p>
                    {order.items && (
                      <p className="text-xs text-neutral-400 mt-1 truncate">
                        {order.items
                          .map((i) => i.product?.name || i.productName)
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <OrderStatusBadge status={order.status} />
                    <p className="text-sm font-bold text-egg-yolk mt-1">
                      Rp
                      {Number(order.totalAmount || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="text-center">
          <Link
            to="/"
            className="text-egg-yolk hover:text-warm-amber text-sm font-medium transition"
          >
            ← Kembali ke Home
          </Link>
        </div>
      </div>
    </div>
  );
}
