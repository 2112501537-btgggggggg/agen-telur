import { useState } from 'react';

export default function AddressForm({ initialData, onSubmit, onCancel }) {
  const [label, setLabel] = useState(initialData?.label || '');
  const [fullAddress, setFullAddress] = useState(initialData?.fullAddress || '');
  const [kecamatan, setKecamatan] = useState(initialData?.kecamatan || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ label, fullAddress, kecamatan, city, isDefault });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-barn-brown mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {initialData ? 'Edit Alamat' : 'Tambah Alamat Baru'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="addr-label" className="block text-sm font-medium text-barn-brown mb-1">
              Label
            </label>
            <input
              id="addr-label"
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none transition text-barn-brown"
              placeholder="Rumah / Kantor"
            />
          </div>

          <div>
            <label htmlFor="addr-full" className="block text-sm font-medium text-barn-brown mb-1">
              Alamat Lengkap
            </label>
            <textarea
              id="addr-full"
              required
              rows="3"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none transition text-barn-brown resize-none"
              placeholder="Jl. Contoh No. 123, RT/RW 001/002"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="addr-kec" className="block text-sm font-medium text-barn-brown mb-1">
                Kecamatan
              </label>
              <input
                id="addr-kec"
                type="text"
                required
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none transition text-barn-brown"
                placeholder="Kecamatan"
              />
            </div>
            <div>
              <label htmlFor="addr-city" className="block text-sm font-medium text-barn-brown mb-1">
                Kota
              </label>
              <input
                id="addr-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none transition text-barn-brown"
                placeholder="Kota"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="addr-default"
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-egg-yolk border-neutral-300 rounded focus:ring-egg-yolk"
            />
            <label htmlFor="addr-default" className="text-sm text-barn-brown">
              Jadikan alamat default
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-barn-brown text-barn-brown font-medium hover:bg-straw-yellow transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-egg-yolk hover:bg-warm-amber text-white font-medium transition disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
