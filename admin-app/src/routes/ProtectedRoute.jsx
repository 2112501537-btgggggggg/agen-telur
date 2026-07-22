import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_ONLY_PATHS = ['/service-area', '/membership', '/laporan'];

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role === 'STAFF' && ADMIN_ONLY_PATHS.includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
