export default function CategoryFilter({ categories, activeCategoryId, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {/* Chip "Semua" */}
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          activeCategoryId === null
            ? 'bg-egg-yolk text-white'
            : 'border border-barn-brown text-barn-brown hover:bg-straw-yellow'
        }`}
      >
        Semua
      </button>

      {/* Chip per kategori */}
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeCategoryId === cat.id
              ? 'bg-egg-yolk text-white'
              : 'border border-barn-brown text-barn-brown hover:bg-straw-yellow'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
