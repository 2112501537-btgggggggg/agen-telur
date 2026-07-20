import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fresh-cream">
        <p className="text-barn-brown text-lg">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-fresh-cream px-4">
      {isAuthenticated ? (
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-barn-brown" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Selamat datang, {user?.name}!
          </h1>
          {user?.isMember && (
            <span className="inline-block bg-egg-yolk text-white text-sm font-semibold px-3 py-1 rounded-full">
              Member
            </span>
          )}
          <p className="text-neutral-500">
            Poin Anda: {user?.totalPoints || 0}
          </p>
          <button
            onClick={handleLogout}
            className="bg-alert-red hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-barn-brown" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Agen Telur
          </h1>
          <p className="text-neutral-500">Silakan login untuk melanjutkan</p>
          <Link
            to="/login"
            className="inline-block bg-egg-yolk hover:bg-warm-amber text-white font-semibold px-8 py-2.5 rounded-lg transition"
          >
            Login
          </Link>
          <p className="text-sm text-neutral-400">
            Belum punya akun?{' '}
            <Link to="/register" className="text-egg-yolk hover:text-warm-amber">
              Daftar
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
