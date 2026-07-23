import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'DELIVERED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

const PAYMENT_STATUSES = [
  { value: 'UNPAID', label: 'Belum Bayar' },
  { value: 'PAID', label: 'Lunas' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'FAILED', label: 'Gagal' },
];

export default function OrderFilterBar({ filters, onUpdateFilter, onReset }) {
  const hasActiveFilters = filters.status || filters.paymentStatus || filters.from || filters.to || filters.search;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nomor order / nama..."
          value={filters.search}
          onChange={(e) => onUpdateFilter('search', e.target.value)}
          className="pl-8"
        />
      </div>

      <Select
        value={filters.status}
        onValueChange={(val) => onUpdateFilter('status', val)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status Order" />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.paymentStatus}
        onValueChange={(val) => onUpdateFilter('paymentStatus', val)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status Bayar" />
        </SelectTrigger>
        <SelectContent>
          {PAYMENT_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={filters.from}
        onChange={(e) => onUpdateFilter('from', e.target.value)}
        className="w-[150px]"
        placeholder="Dari tanggal"
      />
      <Input
        type="date"
        value={filters.to}
        onChange={(e) => onUpdateFilter('to', e.target.value)}
        className="w-[150px]"
        placeholder="Sampai tanggal"
      />

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
          Reset
        </button>
      )}
    </div>
  );
}
