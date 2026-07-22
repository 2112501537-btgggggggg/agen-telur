import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { listAddresses } from '../api/address.api';
import { validateCheckout, createOrder } from '../api/orders.api';
import { loadMidtransScript } from '../utils/loadMidtransScript';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart, totalItemsCount } = useCart();
  const { user } = useAuth();

  // States
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentType, setPaymentType] = useState('COD');
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingAddr, setLoadingAddr] = useState(true);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [items, navigate]);

  // Load addresses + preload Midtrans script
  useEffect(() => {
    setLoadingAddr(true);
    listAddresses()
      .then((res) => {
        const data = res.data || [];
        setAddresses(data);
        // Auto-select default address or first
        const defaultAddr = data.find((a) => a.isDefault) || data[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        }
      })
      .catch(() => setErrorMessage('Gagal memuat alamat'))
      .finally(() => setLoadingAddr(false));

    // Preload Midtrans script in background
    loadMidtransScript().catch(() => {});
  }, []);

  // Real-time validation
  useEffect(() => {
    if (!selectedAddressId || items.length === 0) {
      setValidationResult(null);
      return;
    }

    const validationItems = items.map((i) => ({
      productVariantId: i.productVariantId,
      unit: i.unit,
      quantity: i.quantity,
    }));

    setIsValidating(true);
    setErrorMessage('');

    validateCheckout({
      addressId: selectedAddressId,
      items: validationItems,
    })
      .then((res) => {
        setValidationResult(res.data);
        setErrorMessage('');
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Validasi gagal';
        setErrorMessage(msg);
        setValidationResult({ isValid: false });
      })
      .finally(() => setIsValidating(false));
  }, [selectedAddressId, items]);

  const isFormValid =
    selectedAddressId &&
    validationResult?.isValid === true &&
    !isSubmitting;

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    setErrorMessage('');

    const orderItems = items.map((i) => ({
      productVariantId: i.productVariantId,
      unit: i.unit,
      quantity: i.quantity,
    }));

    try {
      const res = await createOrder({
        addressId: selectedAddressId,
        paymentType,
        items: orderItems,
      });

      const orderId = res.data?.orderId || res.data?.id;

      if (paymentType === 'COD') {
        clearCart();
        navigate(`/orders/${orderId}`, { replace: true });
        return;
      }

      // MIDTRANS flow
      try {
        await loadMidtransScript();
      } catch {
        // Script may already be loaded, continue anyway
      }

      const snapToken = res.data?.midtransSnapToken;

      if (!snapToken || !window.snap) {
        // Fallback: treat like COD success
        clearCart();
        navigate(`/orders/${orderId}`, { replace: true });
        return;
      }

      window.snap.pay(snapToken, {
        onSuccess: () => {
          clearCart();
          navigate(`/orders/${orderId}`, { replace: true });
        },
        onPending: () => {
          clearCart();
          navigate(`/orders/${orderId}`, { replace: true });
        },
        onError: () => {
          clearCart();
          navigate(`/orders/${orderId}`, {
            replace: true,
            state: { paymentMessage: 'Pembayaran gagal, silakan coba lagi dari halaman Riwayat Pesanan' },
          });
        },
        onClose: () => {
          clearCart();
          navigate(`/orders/${orderId}`, {
            replace: true,
            state: { paymentMessage: 'Pembayaran belum selesai. Order Anda tetap tersimpan, silakan lanjutkan pembayaran nanti.' },
          });
        },
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Gagal membuat pesanan. Silakan coba lagi.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, selectedAddressId, paymentType, items, clearCart, navigate]);

  // Empty cart guard (prevent flash before redirect)
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-fresh-cream">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1
          className="text-2xl font-bold text-barn-brown mb-6"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT COLUMN — 3/5 width */}
          <div className="lg:col-span-3 space-y-6">
            {/* Address Selection */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-barn-brown">Alamat Pengiriman</h2>

              {loadingAddr ? (
                <p className="text-sm text-neutral-400">Memuat alamat...</p>
              ) : addresses.length === 0 ? (
                <div className="text-sm text-neutral-500">
                  <p>Belum ada alamat tersimpan.</p>
                  <Link
                    to="/addresses"
                    className="text-egg-yolk hover:text-warm-amber font-medium"
                  >
                    + Tambah alamat baru
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`block p-3 rounded-lg border cursor-pointer transition ${
                        selectedAddressId === addr.id
                          ? 'border-egg-yolk bg-straw-yellow/20'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 text-egg-yolk focus:ring-egg-yolk"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-barn-brown">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-egg-yolk text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {addr.fullAddress}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {addr.kecamatan}, {addr.city}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                  <Link
                    to="/addresses"
                    className="inline-block text-sm text-egg-yolk hover:text-warm-amber font-medium"
                  >
                    + Tambah alamat baru
                  </Link>
                </div>
              )}
            </div>

            {/* Order Items Summary */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-barn-brown">
                Pesanan ({totalItemsCount} item)
              </h2>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {items.map((item, idx) => {
                  const berat = item.quantity * item.kgEquivalent;
                  const subtotal = berat * item.pricePerKg;
                  return (
                    <div
                      key={`${item.productVariantId}-${item.unit}-${idx}`}
                      className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-barn-brown truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-neutral-400">
                          Grade: {item.grade} | {item.quantity}x{item.unit}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-egg-yolk ml-3 shrink-0">
                        Rp{subtotal.toLocaleString('id-ID')}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Link
                to="/cart"
                className="text-sm text-egg-yolk hover:text-warm-amber font-medium inline-block"
              >
                Edit Keranjang →
              </Link>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-barn-brown">Metode Pembayaran</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    paymentType === 'COD'
                      ? 'border-egg-yolk bg-straw-yellow/20'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentType"
                      value="COD"
                      checked={paymentType === 'COD'}
                      onChange={() => setPaymentType('COD')}
                      className="text-egg-yolk focus:ring-egg-yolk"
                    />
                    <div>
                      <p className="text-sm font-medium text-barn-brown">COD</p>
                      <p className="text-xs text-neutral-400">Bayar di Tempat</p>
                    </div>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    paymentType === 'MIDTRANS'
                      ? 'border-egg-yolk bg-straw-yellow/20'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentType"
                      value="MIDTRANS"
                      checked={paymentType === 'MIDTRANS'}
                      onChange={() => setPaymentType('MIDTRANS')}
                      className="text-egg-yolk focus:ring-egg-yolk"
                    />
                    <div>
                      <p className="text-sm font-medium text-barn-brown">Bayar Online</p>
                      <p className="text-xs text-neutral-400">QRIS / E-Wallet / VA</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — 2/5 width, sticky summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-4 lg:sticky lg:top-8">
              <h2 className="font-semibold text-barn-brown">Ringkasan Biaya</h2>

              {/* Progress bar: minimum order */}
              {validationResult && !validationResult.isValid && errorMessage && (
                <div className="text-alert-red text-sm bg-alert-red/10 rounded-lg px-3 py-2">
                  {errorMessage}
                </div>
              )}

              {validationResult && validationResult.isValid && (
                <>
                  {/* Weight info */}
                  {validationResult.totalWeightKg && (
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Total berat</span>
                      <span className="font-medium text-barn-brown">
                        {Number(validationResult.totalWeightKg).toFixed(1)} kg
                      </span>
                    </div>
                  )}

                  {/* Subtotal */}
                  <div className="flex justify-between text-sm text-neutral-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-barn-brown">
                      Rp
                      {Number(validationResult.subtotalAmount).toLocaleString(
                        'id-ID'
                      )}
                    </span>
                  </div>

                  {/* Discount */}
                  {Number(validationResult.discountAmount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-fresh-green flex items-center gap-1">
                        Diskon Member 🎉
                      </span>
                      <span className="font-medium text-fresh-green">
                        -Rp
                        {Number(validationResult.discountAmount).toLocaleString(
                          'id-ID'
                        )}
                      </span>
                    </div>
                  )}

                  <hr className="border-neutral-200" />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-barn-brown font-semibold">Total</span>
                    <span className="text-xl font-bold text-egg-yolk">
                      Rp
                      {Number(validationResult.totalAmount).toLocaleString(
                        'id-ID'
                      )}
                    </span>
                  </div>
                </>
              )}

              {/* Weight progress bar for minimum order warning */}
              {validationResult && !validationResult.isValid && errorMessage && (
                <>
                  {validationResult.totalWeightKg && (
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Total berat</span>
                      <span className="font-medium text-barn-brown">
                        {Number(validationResult.totalWeightKg).toFixed(1)} kg
                      </span>
                    </div>
                  )}

                  {errorMessage.toLowerCase().includes('minimum') && (
                    <div className="w-full bg-straw-yellow rounded-full h-2">
                      <div
                        className="bg-egg-yolk h-2 rounded-full"
                        style={{
                          width:
                            validationResult.totalWeightKg
                              ? `${Math.min(
                                  100,
                                  (Number(validationResult.totalWeightKg) / 5) * 100
                                )}%`
                              : '0%',
                        }}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Loading state */}
              {isValidating && (
                <p className="text-sm text-neutral-400 text-center">
                  Memvalidasi...
                </p>
              )}

              {/* Error message from submit */}
              {!isValidating && errorMessage && !validationResult?.isValid && (
                <div className="text-alert-red text-sm bg-alert-red/10 rounded-lg px-3 py-2">
                  {errorMessage}
                </div>
              )}

              {/* Submit error */}
              {!isValidating &&
                errorMessage &&
                validationResult?.isValid && (
                  <div className="text-alert-red text-sm bg-alert-red/10 rounded-lg px-3 py-2">
                    {errorMessage}
                  </div>
                )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`w-full py-3 rounded-lg text-white font-semibold text-lg transition ${
                  isFormValid
                    ? 'bg-egg-yolk hover:bg-warm-amber cursor-pointer'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting
                  ? 'Memproses...'
                  : paymentType === 'COD'
                    ? 'Bayar Sekarang (COD)'
                    : 'Bayar Sekarang'}
              </button>

              <div className="text-center">
                <Link
                  to="/cart"
                  className="text-xs text-neutral-400 hover:text-egg-yolk transition"
                >
                  ← Kembali ke Keranjang
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
