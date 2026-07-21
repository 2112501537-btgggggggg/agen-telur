import { useParams, useLocation, Link } from 'react-router-dom';

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const paymentMsg = location.state?.paymentMessage;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-fresh-cream px-4 text-center gap-4">
      <span className="text-7xl">🎉</span>
      <h1
        className="text-2xl font-bold text-barn-brown"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        Pesanan #{id} berhasil dibuat!
      </h1>
      {paymentMsg && (
        <p className="text-sm text-neutral-500 max-w-md bg-straw-yellow/50 rounded-lg px-4 py-2">
          {paymentMsg}
        </p>
      )}
      <p className="text-neutral-400 text-sm">
        Detail lengkap pesanan segera hadir.
      </p>
      <div className="flex gap-3 mt-2">
        <Link
          to="/"
          className="bg-egg-yolk hover:bg-warm-amber text-white font-semibold px-6 py-2.5 rounded-lg transition"
        >
          Kembali ke Home
        </Link>
      </div>
    </div>
  );
}
