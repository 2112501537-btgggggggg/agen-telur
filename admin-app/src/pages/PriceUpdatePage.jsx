import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PriceTable from '@/components/price/PriceTable';
import { usePriceVariants } from '@/hooks/usePriceVariants';

export default function PriceUpdatePage() {
  const { variants, isLoading, error, search, setSearch, refetch, handleUpdatePrice } = usePriceVariants();

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-alert-red text-sm mb-3">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-egg-yolk text-white rounded-lg text-sm font-medium hover:bg-warm-amber transition-colors">
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Update Harga Harian</h2>

      {variants.length > 0 && (
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-gray" />
          <Input
            placeholder="Cari nama produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <PriceTable
        variants={variants}
        isLoading={isLoading}
        onUpdatePrice={handleUpdatePrice}
      />
    </div>
  );
}
