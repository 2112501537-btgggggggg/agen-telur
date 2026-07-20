import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../api/products.api';
import { listUnitConversions } from '../api/unitConversions.api';
import { useCart } from '../context/CartContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [conversions, setConversions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('KG');
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError('');
    Promise.all([getProductById(id), listUnitConversions()])
      .then(([prodRes, convRes]) => {
        const prod = prodRes.data || prodRes;
        const convs = convRes.data || convRes || [];
        setProduct(prod);
        setConversions(convs);
        if (prod.variants?.length > 0) {
          setSelectedGrade(prod.variants[0].id);
        }
      })
      .catch(() => setError('Gagal memuat detail produk'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const selectedVariant = product?.variants?.find((v) => v.id === selectedGrade);
  const selectedConv = conversions.find((c) => c.unit === selectedUnit);
  const kgEquivalent = selectedConv ? Number(selectedConv.kgEquivalent) : 1;
  const beratKg = quantity * kgEquivalent;
  const estimasiSubtotal = selectedVariant ? beratKg * Number(selectedVariant.pricePerKg) : 0;

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      productVariantId: selectedVariant.id,
      productName: product.name,
      grade: selectedVariant.grade,
      unit: selectedUnit,
      quantity,
      pricePerKg: Number(selectedVariant.pricePerKg),
      kgEquivalent,
      imageUrl: product.imageUrl || null,
    });
    setFeedback('✓ Ditambahkan');
    setTimeout(() => setFeedback(''), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fresh-cream">
        <p className="text-barn-brown text-lg">Memuat...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fresh-cream gap-4">
        <p className="text-alert-red text-lg">{error || 'Produk tidak ditemukan'}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-egg-yolk hover:bg-warm-amber text-white font-semibold px-6 py-2 rounded-lg transition"
        >
          Kembali ke Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fresh-cream">
      {/* Back link */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-neutral-500 hover:text-barn-brown transition"
        >
          ← Kembali
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Image */}
        <div className="aspect-square bg-straw-yellow rounded-xl flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-8xl">🥚</span>
          )}
        </div>

        {/* Right: Details */}
        <div className="space-y-6">
          <div>
            {product.category && (
              <span className="text-xs text-barn-brown bg-straw-yellow px-2.5 py-1 rounded-full">
                {product.category.name}
              </span>
            )}
            <h1
              className="text-2xl font-bold text-barn-brown mt-2"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {product.name}
            </h1>
            {product.description && (
              <p className="text-neutral-500 text-sm mt-1">{product.description}</p>
            )}
          </div>

          {/* Grade Selector */}
          <div>
            <p className="text-sm font-medium text-barn-brown mb-2">Pilih Grade:</p>
            <div className="flex flex-wrap gap-2">
              {product.variants?.map((v) => {
                const isDisabled = Number(v.stockKg) === 0;
                const isSelected = selectedGrade === v.id;
                return (
                  <button
                    key={v.id}
                    disabled={isDisabled}
                    onClick={() => {
                      setSelectedGrade(v.id);
                      setQuantity(1);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                      isSelected
                        ? 'bg-straw-yellow border-straw-yellow text-barn-brown'
                        : isDisabled
                          ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
                          : 'border-neutral-300 text-barn-brown hover:bg-straw-yellow/50'
                    }`}
                  >
                    {v.grade}
                    {isDisabled && ' (Habis)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-barn-brown mb-1">Satuan</label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none text-barn-brown"
              >
                {conversions.map((c) => (
                  <option key={c.unit} value={c.unit}>
                    {c.unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-barn-brown mb-1">Jumlah</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-full border border-neutral-300 text-barn-brown text-lg font-bold hover:bg-straw-yellow transition flex items-center justify-center"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center px-2 py-1.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none text-barn-brown"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-full border border-neutral-300 text-barn-brown text-lg font-bold hover:bg-straw-yellow transition flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          {selectedVariant && (
            <div className="bg-white rounded-lg p-4 border border-straw-yellow space-y-1">
              <p className="text-sm text-neutral-500">
                Harga: <span className="font-semibold text-barn-brown">Rp{Number(selectedVariant.pricePerKg).toLocaleString('id-ID')}/kg</span>
              </p>
              <p className="text-sm text-neutral-500">
                ≈ {beratKg}kg × Rp{Number(selectedVariant.pricePerKg).toLocaleString('id-ID')}
              </p>
              <p className="text-lg font-bold text-egg-yolk">
                Estimasi: Rp{estimasiSubtotal.toLocaleString('id-ID')}
              </p>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || feedback !== ''}
            className={`w-full py-3 rounded-lg text-white font-semibold text-lg transition ${
              feedback === '✓ Ditambahkan'
                ? 'bg-fresh-green'
                : 'bg-egg-yolk hover:bg-warm-amber disabled:opacity-50'
            }`}
          >
            {feedback || 'Tambah ke Keranjang'}
          </button>

          {selectedVariant && Number(selectedVariant.stockKg) > 0 && (
            <p className="text-xs text-neutral-400 text-center">
              Stok: {Number(selectedVariant.stockKg).toLocaleString('id-ID')} kg
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
