import { useState, useEffect, useRef } from 'react';
import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getCategories } from '../../api/category.api';

export default function ProductFilterBar({ filters, onFilterChange }) {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(filters.search || '');
  const debounceRef = useRef(null);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange({ ...filters, search: val });
    }, 400);
  };

  const handleCategoryChange = (e) => {
    onFilterChange({ ...filters, categoryId: e.target.value });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <select
        value={filters.categoryId}
        onChange={handleCategoryChange}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">Semua Kategori</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <div className="relative max-w-xs">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-gray" />
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>
    </div>
  );
}
