import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MembershipConfigForm({ config, isSubmitting, onSubmit }) {
  const [form, setForm] = useState({
    pointsPerRupiah: '',
    pointsThresholdForMember: '',
    memberDiscountPercent: '',
    minimumOrderKg: '',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    if (config) {
      setForm({
        pointsPerRupiah: config.pointsPerRupiah ?? '',
        pointsThresholdForMember: config.pointsThresholdForMember ?? '',
        memberDiscountPercent: config.memberDiscountPercent ?? '',
        minimumOrderKg: config.minimumOrderKg ?? '',
      });
    }
  }, [config]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getChanges = () => {
    const result = [];
    if (form.pointsPerRupiah !== '' && Number(form.pointsPerRupiah) !== Number(config.pointsPerRupiah)) {
      result.push({ label: 'Poin per Rupiah', old: config.pointsPerRupiah, new: form.pointsPerRupiah });
    }
    if (form.pointsThresholdForMember !== '' && Number(form.pointsThresholdForMember) !== Number(config.pointsThresholdForMember)) {
      result.push({ label: 'Threshold Poin Member', old: config.pointsThresholdForMember, new: form.pointsThresholdForMember });
    }
    if (form.memberDiscountPercent !== '' && Number(form.memberDiscountPercent) !== Number(config.memberDiscountPercent)) {
      result.push({ label: 'Diskon Member', old: `${config.memberDiscountPercent}%`, new: `${form.memberDiscountPercent}%` });
    }
    if (form.minimumOrderKg !== '' && Number(form.minimumOrderKg) !== Number(config.minimumOrderKg)) {
      result.push({ label: 'Minimum Order', old: `${config.minimumOrderKg} kg`, new: `${form.minimumOrderKg} kg` });
    }
    return result;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ch = getChanges();
    if (ch.length === 0) return;
    setChanges(ch);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    const payload = {
      pointsPerRupiah: Number(form.pointsPerRupiah),
      pointsThresholdForMember: Number(form.pointsThresholdForMember),
      memberDiscountPercent: Number(form.memberDiscountPercent),
      minimumOrderKg: Number(form.minimumOrderKg),
    };
    const result = await onSubmit(payload);
    if (result?.success) {
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-6 max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Threshold Poin untuk jadi Member <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              value={form.pointsThresholdForMember}
              onChange={(e) => handleChange('pointsThresholdForMember', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Saat ini: {config?.pointsThresholdForMember ?? '-'} poin</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Persen Diskon Member <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.memberDiscountPercent}
                onChange={(e) => handleChange('memberDiscountPercent', e.target.value)}
                required
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Saat ini: {config?.memberDiscountPercent ?? '-'}%</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Minimum Order (kg) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={form.minimumOrderKg}
                onChange={(e) => handleChange('minimumOrderKg', e.target.value)}
                required
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Saat ini: {config?.minimumOrderKg ?? '-'} kg</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Poin per Rupiah <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0.0001"
              step="0.0001"
              value={form.pointsPerRupiah}
              onChange={(e) => handleChange('pointsPerRupiah', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Saat ini: {config?.pointsPerRupiah ?? '-'} — Contoh: 0.01 berarti tiap Rp1.000 belanja = 10 poin
            </p>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting || getChanges().length === 0}>
          Simpan Perubahan
        </Button>
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Perubahan Konfigurasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Perubahan ini akan berlaku untuk semua transaksi berikutnya. Lanjutkan?
            </p>
            <div className="mt-3 space-y-1">
              {changes.map((c, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span>
                    <span className="line-through text-red-500 mr-2">{String(c.old)}</span>
                    <span className="font-medium">{String(c.new)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
            <Button onClick={handleConfirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Ya, Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
