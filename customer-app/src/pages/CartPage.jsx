import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalItemsCount } = useCart();
  const navigate = useNavigate();

  const totalHarga = items.reduce((sum, item) => {
    const berat = item.quantity * item.kgEquivalent;
    return sum + berat * item.pricePerKg;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fresh-cream px-4 gap-4">
        <span className="text-7xl">🛒</span>
        <h1 className="text-2xl font-bold text-barn-brown text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Keranjang Masih Kosong
        </h1>
        <p className="text-neutral-500 text-center">
          Yuk, tambah produk dulu!
        </p>
        <Link
          to="/"
          className="bg-egg-yolk hover:bg-warm-amber text-white font-semibold px-8 py-2.5 rounded-lg transition"
        >
          Lihat Produk
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fresh-cream">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-barn-brown" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Keranjang ({totalItemsCount} item)
        </h1>

        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item, idx) => {
            const beratItem = item.quantity * item.kgEquivalent;
            const subtotal = beratItem * item.pricePerKg;
            return (
              <div
                key={`${item.productVariantId}-${item.unit}`}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4"
              >
                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-barn-brown truncate">{item.productName}</p>
                  <p className="text-xs text-neutral-400">
                    Grade: {item.grade} | {item.unit}
                  </p>
                  <p className="text-sm text-egg-yolk font-bold mt-1">
                    Rp{subtotal.toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      updateQuantity(item.productVariantId, item.unit, item.quantity - 1)
                    }
                    className="w-7 h-7 rounded-full border border-neutral-300 text-barn-brown font-bold text-sm hover:bg-straw-yellow transition flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-barn-brown">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productVariantId, item.unit, item.quantity + 1)
                    }
                    className="w-7 h-7 rounded-full border border-neutral-300 text-barn-brown font-bold text-sm hover:bg-straw-yellow transition flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.productVariantId, item.unit)}
                  className="text-alert-red hover:text-red-700 text-sm font-medium shrink-0"
                >
                  Hapus
                </button>
              </div>
            );
          })}
        </div>

        {/* Total & Checkout */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-barn-brown font-medium">Total</span>
            <span className="text-2xl font-bold text-egg-yolk">
              Rp{totalHarga.toLocaleString('id-ID')}
            </span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-egg-yolk hover:bg-warm-amber text-white font-semibold py-3 rounded-lg transition text-lg"
          >
            Lanjut ke Checkout
          </button>
        </div>

        {/* Continue shopping */}
        <div className="text-center">
          <Link to="/" className="text-egg-yolk hover:text-warm-amber font-medium text-sm">
            ← Lanjut Belanja
          </Link>
        </div>
      </div>
    </div>
  );
}
