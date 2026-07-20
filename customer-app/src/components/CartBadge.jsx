import { useCart } from '../context/CartContext';

export default function CartBadge() {
  const { totalItemsCount } = useCart();

  if (totalItemsCount === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 bg-egg-yolk text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
      {totalItemsCount > 99 ? '99+' : totalItemsCount}
    </span>
  );
}
