import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AddressCard from '../components/AddressCard';
import AddressForm from '../components/AddressForm';
import * as addressApi from '../api/address.api';

export default function AddressPage() {
  const [addresses, setAddresses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAddresses = () => {
    setIsLoading(true);
    setError('');
    addressApi
      .listAddresses()
      .then((res) => {
        setAddresses(res.data || []);
      })
      .catch(() => setError('Gagal memuat alamat'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAdd = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editingAddress) {
      await addressApi.updateAddress(editingAddress.id, data);
    } else {
      await addressApi.createAddress(data);
    }
    setIsFormOpen(false);
    setEditingAddress(null);
    fetchAddresses();
  };

  const handleDelete = async (id) => {
    await addressApi.deleteAddress(id);
    fetchAddresses();
  };

  return (
    <div className="min-h-screen bg-fresh-cream">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-barn-brown" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Alamat Saya
          </h1>
          <button
            onClick={handleAdd}
            className="bg-egg-yolk hover:bg-warm-amber text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
          >
            + Tambah Alamat Baru
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-alert-red/10 text-alert-red text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <p className="text-neutral-500">Memuat...</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && addresses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <span className="text-6xl">📍</span>
            <p className="text-barn-brown font-medium">Belum ada alamat tersimpan</p>
            <p className="text-neutral-400 text-sm">Tambahkan alamat pengiriman agar bisa checkout</p>
          </div>
        )}

        {/* Address List */}
        {!isLoading && addresses.length > 0 && (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="text-center">
          <Link to="/" className="text-egg-yolk hover:text-warm-amber text-sm font-medium transition">
            ← Kembali ke Home
          </Link>
        </div>
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <AddressForm
          initialData={editingAddress}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingAddress(null);
          }}
        />
      )}
    </div>
  );
}
