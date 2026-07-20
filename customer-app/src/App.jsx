import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function ProductDetailPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-fresh-cream">
      <p className="text-barn-brown text-lg">Halaman detail produk, segera hadir</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products/:id" element={<ProductDetailPlaceholder />} />
    </Routes>
  );
}

export default App;
