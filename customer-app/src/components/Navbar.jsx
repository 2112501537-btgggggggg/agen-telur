import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ searchQuery, onSearchChange, onSearchSubmit }) {
  const { user, isAuthenticated } = useAuth();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit(e.target.value);
    }
  };

  return (
    <nav className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo / Nama Toko */}
        <Link to="/" className="text-lg font-bold text-barn-brown shrink-0" style={{ fontFamily: 'Poppins, sans-serif' }}>
          🥚 Toko Agen Telur
        </Link>

        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => {
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Cari produk..."
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none transition text-barn-brown"
          />
        </div>

        {/* Ikon Keranjang (badge 0 statis) */}
        <Link to="/cart" className="relative text-barn-brown hover:text-egg-yolk transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <span className="absolute -top-1.5 -right-1.5 bg-egg-yolk text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            0
          </span>
        </Link>

        {/* Profil / Login */}
        <div className="text-sm font-medium shrink-0">
          {isAuthenticated ? (
            <Link to="/profile" className="text-barn-brown hover:text-egg-yolk transition-colors">
              {user?.name}
            </Link>
          ) : (
            <Link to="/login" className="text-egg-yolk hover:text-warm-amber transition-colors">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
