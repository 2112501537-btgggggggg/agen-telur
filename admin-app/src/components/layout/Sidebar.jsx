import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Tags,
  Package,
  DollarSign,
  Warehouse,
  Users,
  ClipboardList,
  MapPin,
  Settings,
  FileBarChart,
  X,
} from 'lucide-react';

const allMenuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF'] },
  { name: 'Kategori', path: '/kategori', icon: Tags, roles: ['ADMIN', 'STAFF'] },
  { name: 'Produk', path: '/produk', icon: Package, roles: ['ADMIN', 'STAFF'] },
  { name: 'Harga Harian', path: '/harga-harian', icon: DollarSign, roles: ['ADMIN', 'STAFF'] },
  { name: 'Stok', path: '/stok', icon: Warehouse, roles: ['ADMIN', 'STAFF'] },
  { name: 'Supplier', path: '/supplier', icon: Users, roles: ['ADMIN', 'STAFF'] },
  { name: 'Pesanan', path: '/pesanan', icon: ClipboardList, roles: ['ADMIN', 'STAFF'] },
  { name: 'Service Area', path: '/service-area', icon: MapPin, roles: ['ADMIN'] },
  { name: 'Membership Config', path: '/membership', icon: Settings, roles: ['ADMIN'] },
  { name: 'Laporan', path: '/laporan', icon: FileBarChart, roles: ['ADMIN'] },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = allMenuItems.filter((item) => item.roles.includes(user?.role));

  const sidebarContent = (
    <div className="w-64 bg-slate-900 text-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 px-4 pt-4">
        <div>
          <h1 className="text-xl font-bold text-egg-yolk">Agen Telur</h1>
          <p className="text-xs text-slate-400">Admin Panel</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded hover:bg-slate-800 text-slate-400"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                isActive
                  ? 'bg-egg-yolk text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <p className="text-xs text-slate-500 font-mono">v1.0.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="relative w-64 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
