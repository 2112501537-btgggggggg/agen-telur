import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CategoryPage from './pages/CategoryPage';
import ProductListPage from './pages/ProductListPage';
import ProductFormPage from './pages/ProductFormPage';
import PriceUpdatePage from './pages/PriceUpdatePage';
import StockManagementPage from './pages/StockManagementPage';
import OrderListPage from './pages/OrderListPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ServiceAreaPage from './pages/ServiceAreaPage';
import MembershipConfigPage from './pages/MembershipConfigPage';
import ReportsPage from './pages/ReportsPage';

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
        <Route path="/kategori" element={<CategoryPage />} />
        <Route path="/produk" element={<ProductListPage />} />
        <Route path="/produk/tambah" element={<ProductFormPage />} />
        <Route path="/produk/:id/edit" element={<ProductFormPage />} />
        <Route path="/harga-harian" element={<PriceUpdatePage />} />
        <Route path="/stok" element={<StockManagementPage />} />
        <Route path="/pesanan" element={<OrderListPage />} />
        <Route path="/pesanan/:id" element={<OrderDetailPage />} />
        <Route path="/service-area" element={<ServiceAreaPage />} />
        <Route path="/membership" element={<MembershipConfigPage />} />
        <Route path="/laporan" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
