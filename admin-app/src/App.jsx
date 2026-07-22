import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function Placeholder({ title }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      <p className="text-slate-500 mt-2">Halaman ini akan segera tersedia.</p>
    </div>
  );
}

function LoginRedirect() {
  const { isAuthenticated: isAuth } = useAuth();
  if (isAuth) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginRedirect />}
      />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/kategori" element={<Placeholder title="Kategori" />} />
        <Route path="/produk" element={<Placeholder title="Produk" />} />
        <Route path="/harga-harian" element={<Placeholder title="Harga Harian" />} />
        <Route path="/stok" element={<Placeholder title="Stok" />} />
        <Route path="/supplier" element={<Placeholder title="Supplier" />} />
        <Route path="/pesanan" element={<Placeholder title="Pesanan" />} />
        <Route path="/service-area" element={<Placeholder title="Service Area" />} />
        <Route path="/membership" element={<Placeholder title="Membership Config" />} />
        <Route path="/laporan" element={<Placeholder title="Laporan" />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
