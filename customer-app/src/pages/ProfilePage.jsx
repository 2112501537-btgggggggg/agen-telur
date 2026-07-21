import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMembershipInfo } from '../api/membershipInfo.api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [membershipInfo, setMembershipInfo] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  useEffect(() => {
    getMembershipInfo()
      .then((res) => {
        setMembershipInfo(res.data);
      })
      .catch(() => {
        // Silently fail — profile still shows basic info
      })
      .finally(() => setIsLoadingInfo(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const threshold = membershipInfo?.pointsThresholdForMember || 500;
  const discountPercent = membershipInfo?.memberDiscountPercent || 0;
  const totalPoints = user?.totalPoints || 0;
  const isMember = user?.isMember || false;
  const progressPercent = Math.min(100, (totalPoints / threshold) * 100);

  return (
    <div className="min-h-screen bg-fresh-cream">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <h1
          className="text-2xl font-bold text-barn-brown"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Profil Saya
        </h1>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          {/* Avatar placeholder */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-egg-yolk flex items-center justify-center text-white text-3xl font-bold">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="text-center space-y-1">
            <h2
              className="text-xl font-bold text-barn-brown"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {user?.name || '-'}
            </h2>
            <p className="text-sm text-neutral-500">{user?.email || '-'}</p>
            {user?.phone && (
              <p className="text-sm text-neutral-400">{user.phone}</p>
            )}
          </div>
        </div>

        {/* Membership Status Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-barn-brown">Status Member</h2>

          {isLoadingInfo ? (
            <p className="text-sm text-neutral-400">Memuat...</p>
          ) : isMember ? (
            <div className="text-center space-y-3">
              <span className="inline-block bg-egg-yolk text-white text-lg font-bold px-6 py-2 rounded-full">
                🎉 Anda Member!
              </span>
              <p className="text-sm text-neutral-500">
                Nikmati diskon{' '}
                <span className="font-bold text-fresh-green">
                  {discountPercent}%
                </span>{' '}
                di setiap pembelian
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-fresh-green h-3 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-neutral-500 text-center">
                {totalPoints} / {threshold} poin menuju Member
              </p>
              {totalPoints >= threshold && (
                <p className="text-xs text-egg-yolk text-center">
                  Anda sudah mencapai batas poin! Status member akan aktif
                  setelah verifikasi.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Quick Links Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
          <Link
            to="/addresses"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-straw-yellow/30 transition text-barn-brown"
          >
            <span className="text-lg">📍</span>
            <span className="font-medium">Kelola Alamat</span>
          </Link>
          <Link
            to="/orders"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-straw-yellow/30 transition text-barn-brown"
          >
            <span className="text-lg">📦</span>
            <span className="font-medium">Riwayat Pesanan</span>
          </Link>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-lg bg-alert-red/10 text-alert-red font-semibold hover:bg-alert-red hover:text-white transition"
        >
          Logout
        </button>

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
