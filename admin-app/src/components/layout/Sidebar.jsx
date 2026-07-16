import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  Tags, 
  Truck, 
  ClipboardList, 
  MapPin 
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Produk', path: '/products', icon: Package },
  { name: 'Update Harga', path: '/price-update', icon: DollarSign },
  { name: 'Kategori', path: '/categories', icon: Tags },
  { name: 'Supplier', path: '/suppliers', icon: Truck },
  { name: 'Pesanan', path: '/orders', icon: ClipboardList },
  { name: 'Service Area', path: '/service-area', icon: MapPin },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-slate-900 text-slate-100 min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-egg-yolk">Agen Telur Admin</h1>
        <p className="text-xs text-slate-400">Management System</p>
      </div>
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                isActive 
                  ? 'bg-egg-yolk text-white font-medium' 
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 pt-4 mt-auto">
        <p className="text-xs text-slate-500 px-2 font-mono">v1.0.0</p>
      </div>
    </div>
  );
}
