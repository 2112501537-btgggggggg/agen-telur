import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { Badge } from '../ui/badge';

export default function Topbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-egg-yolk/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-egg-yolk">{initials}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-900 leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-500 leading-tight">
              <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'} className="mt-0.5">
                {user?.role === 'ADMIN' ? 'Admin' : 'Staff'}
              </Badge>
            </p>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-alert-red hover:bg-alert-red/5 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
