import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Simple client validation
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
      setError('Semua field wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Pendaftaran gagal. Silakan coba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-fresh-cream px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-barn-brown text-center mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Daftar Akun Baru
        </h1>

        {error && (
          <div className="bg-alert-red/10 text-alert-red text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-barn-brown mb-1">
              Nama Lengkap
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none transition text-barn-brown"
              placeholder="Nama Anda"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-barn-brown mb-1">
              Email
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none transition text-barn-brown"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-sm font-medium text-barn-brown mb-1">
              Nomor Telepon
            </label>
            <input
              id="reg-phone"
              name="phone"
              type="tel"
              required
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none transition text-barn-brown"
              placeholder="08123456789"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-barn-brown mb-1">
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none transition text-barn-brown"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-egg-yolk hover:bg-warm-amber text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-egg-yolk hover:text-warm-amber font-medium">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
