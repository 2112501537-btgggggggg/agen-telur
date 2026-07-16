import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';

function Dashboard() { return <div className="p-6"><h2 className="text-2xl font-bold text-slate-800">Dashboard</h2><p className="text-slate-500 mt-2">Selamat datang di panel admin toko telur.</p></div>; }
function Products() { return <div className="p-6"><h2 className="text-2xl font-bold text-slate-800">Kelola Produk</h2><p className="text-slate-500 mt-2">Modul produk akan diimplementasikan di sini.</p></div>; }
function PriceUpdate() { return <div className="p-6"><h2 className="text-2xl font-bold text-slate-800">Update Harga</h2><p className="text-slate-500 mt-2">Modul riwayat dan update harga telur.</p></div>; }
function Categories() { return <div className="p-6"><h2 className="text-2xl font-bold text-slate-800">Kategori</h2><p className="text-slate-500 mt-2">Kelola kategori produk.</p></div>; }
function Suppliers() { return <div className="p-6"><h2 className="text-2xl font-bold text-slate-800">Supplier</h2><p className="text-slate-500 mt-2">Kelola supplier / peternak telur.</p></div>; }
function Orders() { return <div className="p-6"><h2 className="text-2xl font-bold text-slate-800">Pesanan</h2><p className="text-slate-500 mt-2">Daftar pesanan pelanggan.</p></div>; }
function ServiceArea() { return <div className="p-6"><h2 className="text-2xl font-bold text-slate-800">Service Area</h2><p className="text-slate-500 mt-2">Kelola area layanan pengiriman.</p></div>; }

function App() {
  return (
    <Router>
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-white min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/price-update" element={<PriceUpdate />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/service-area" element={<ServiceArea />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
