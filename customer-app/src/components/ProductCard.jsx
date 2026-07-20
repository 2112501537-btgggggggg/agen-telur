import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const lowestPrice =
    product.variants?.length > 0
      ? Math.min(...product.variants.map((v) => Number(v.pricePerKg)))
      : null;

  const imageUrl = product.imageUrl || null;

  return (
    <div
      onClick={() => navigate(`/products/${product.id}`)}
      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col"
    >
      {/* Image */}
      <div className="aspect-square bg-straw-yellow flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">🥚</span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {/* Badge kategori */}
        {product.category && (
          <span className="text-xs text-barn-brown bg-straw-yellow px-2 py-0.5 rounded-full self-start">
            {product.category.name}
          </span>
        )}

        {/* Nama produk */}
        <h3 className="text-sm font-semibold text-barn-brown leading-tight line-clamp-2">
          {product.name}
        </h3>

        {/* Harga termurah */}
        {lowestPrice !== null && (
          <p className="text-egg-yolk font-bold text-sm mt-auto">
            Mulai dari Rp{lowestPrice.toLocaleString('id-ID')}/kg
          </p>
        )}
      </div>
    </div>
  );
}
