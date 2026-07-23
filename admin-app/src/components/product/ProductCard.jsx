import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatStock(variants) {
  const total = variants.reduce((sum, v) => sum + (Number(v.stockKg) || 0), 0);
  return `${variants.length} grade, stok total ${total}kg`;
}

export default function ProductCard({ product, onEdit, onDelete }) {
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
      <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={`${baseUrl}${product.imageUrl}`}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg className="size-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-xs text-egg-yolk font-medium mb-1">{product.category?.name || '-'}</div>
        <h3 className="font-semibold text-barn-brown text-sm leading-tight mb-2">{product.name}</h3>
        {product.variants && product.variants.length > 0 && (
          <p className="text-xs text-neutral-gray mb-3">{formatStock(product.variants)}</p>
        )}
        {!product.isActive && (
          <span className="inline-block text-xs bg-alert-red/10 text-alert-red px-2 py-0.5 rounded-full mb-2 w-fit">Nonaktif</span>
        )}
        <div className="mt-auto flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(product)}
            className="text-neutral-gray hover:text-egg-yolk"
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(product)}
            className="text-neutral-gray hover:text-alert-red"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
