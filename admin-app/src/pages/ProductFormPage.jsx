import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, UploadIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProductForm } from '@/hooks/useProducts';

const GRADES = ['BESAR', 'SEDANG', 'KECIL'];
const GRADE_LABELS = { BESAR: 'Besar', SEDANG: 'Sedang', KECIL: 'Kecil' };
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function VariantRow({ grade, value, onChange }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border">
      <div className="w-20">
        <span className="text-sm font-medium text-barn-brown">{GRADE_LABELS[grade]}</span>
      </div>
      <div className="flex-1">
        <label className="text-xs text-neutral-gray block mb-1">Harga per Kg</label>
        <Input
          type="number"
          min="0"
          placeholder="0"
          value={value.pricePerKg || ''}
          onChange={(e) => onChange({ ...value, pricePerKg: Number(e.target.value) })}
          className="h-8"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-neutral-gray block mb-1">Stok Awal (kg)</label>
        <Input
          type="number"
          min="0"
          placeholder="0"
          value={value.stockKg || ''}
          onChange={(e) => onChange({ ...value, stockKg: Number(e.target.value) })}
          className="h-8"
        />
      </div>
      <div className="w-24">
        <label className="text-xs text-neutral-gray block mb-1">Threshold</label>
        <Input
          type="number"
          min="0"
          placeholder="10"
          value={value.lowStockThreshold || ''}
          onChange={(e) => onChange({ ...value, lowStockThreshold: Number(e.target.value) })}
          className="h-8"
        />
      </div>
    </div>
  );
}

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { product, categories, isLoading, isSubmitting, handleSubmit } = useProductForm(id);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [variants, setVariants] = useState(
    GRADES.map((g) => ({ grade: g, pricePerKg: 0, stockKg: 0, lowStockThreshold: 10 }))
  );
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategoryId(product.categoryId?.toString() || '');
      setDescription(product.description || '');
      if (product.imageUrl) {
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';
        setImagePreview(`${baseUrl}${product.imageUrl}`);
      }
      if (product.variants && product.variants.length > 0) {
        setVariants(
          GRADES.map((g) => {
            const existing = product.variants.find((v) => v.grade === g);
            return existing
              ? { grade: g, pricePerKg: existing.pricePerKg, stockKg: existing.stockKg, lowStockThreshold: existing.lowStockThreshold }
              : { grade: g, pricePerKg: 0, stockKg: 0, lowStockThreshold: 10 };
          })
        );
      }
    }
  }, [product]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: 'Format file tidak didukung. Hanya JPEG, PNG, dan WebP.' }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, image: 'Ukuran file maksimal 2MB.' }));
      return;
    }
    setErrors((prev) => ({ ...prev, image: null }));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVariantChange = (index, newValue) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? newValue : v)));
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Nama produk wajib diisi';
    if (!categoryId) errs.categoryId = 'Kategori wajib dipilih';
    if (!isEdit && !imageFile) errs.image = 'Gambar produk wajib diunggah';
    const hasAnyVariant = variants.some((v) => v.pricePerKg > 0);
    if (!hasAnyVariant) errs.variants = 'Minimal satu varian harus memiliki harga';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('categoryId', categoryId);
    if (description.trim()) formData.append('description', description.trim());
    if (imageFile) formData.append('image', imageFile);
    const activeVariants = variants.filter((v) => v.pricePerKg > 0);
    const result = await handleSubmit(formData, isEdit ? undefined : activeVariants);
    if (result.success) navigate('/produk');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-500">Memuat data produk...</p>
      </div>
    );
  }

  if (isEdit && !product && !isLoading) {
    return (
      <div className="text-center py-16">
        <p className="text-alert-red text-sm mb-3">Produk tidak ditemukan</p>
        <Button onClick={() => navigate('/produk')} className="bg-egg-yolk text-white hover:bg-warm-amber">Kembali</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/produk')} className="flex items-center gap-2 text-sm text-neutral-gray hover:text-barn-brown transition-colors">
        <ArrowLeftIcon className="size-4" />
        Kembali ke Daftar Produk
      </button>

      <h2 className="text-2xl font-bold text-slate-800">{isEdit ? 'Edit Produk' : 'Tambah Produk'}</h2>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Info Dasar */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h3 className="font-semibold text-barn-brown">Info Dasar</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Produk <span className="text-alert-red">*</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Telur Ayam Negeri" disabled={isSubmitting} className={errors.name ? 'border-alert-red' : ''} />
            {errors.name && <p className="text-xs text-alert-red mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Kategori <span className="text-alert-red">*</span></label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={isSubmitting} className={`h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${errors.categoryId ? 'border-alert-red' : 'border-input'}`}>
              <option value="">Pilih Kategori</option>
              {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
            {errors.categoryId && <p className="text-xs text-alert-red mt-1">{errors.categoryId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi produk (opsional)" rows={3} disabled={isSubmitting} className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none" />
          </div>
        </div>

        {/* Gambar Produk */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h3 className="font-semibold text-barn-brown">Gambar Produk</h3>
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="w-40 h-40 object-cover rounded-lg border" />
              <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 size-6 bg-alert-red text-white rounded-full flex items-center justify-center hover:bg-alert-red/80">
                <XIcon className="size-3" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-40 h-40 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-egg-yolk hover:bg-straw-yellow/20 transition-colors">
              <UploadIcon className="size-8 text-slate-400" />
              <span className="text-xs text-neutral-gray">Klik untuk upload</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
          {errors.image && <p className="text-xs text-alert-red">{errors.image}</p>}
          <p className="text-xs text-neutral-gray">Format: JPEG, PNG, WebP. Maksimal 2MB.</p>
        </div>

        {/* Varian Grade */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h3 className="font-semibold text-barn-brown">Varian Grade</h3>
          {errors.variants && <p className="text-xs text-alert-red">{errors.variants}</p>}
          <div className="space-y-3">
            {GRADES.map((grade, idx) => (
              <VariantRow key={grade} grade={grade} value={variants[idx]} onChange={(v) => handleVariantChange(idx, v)} />
            ))}
          </div>
          <p className="text-xs text-neutral-gray">Isi harga untuk grade yang dijual. Grade tanpa harga akan dilewati.</p>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/produk')} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-egg-yolk text-white hover:bg-warm-amber">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
          </Button>
        </div>
      </form>
    </div>
  );
}
