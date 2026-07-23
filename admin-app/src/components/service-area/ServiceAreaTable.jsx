import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ServiceAreaTable({ areas, search, onSearchChange, onEdit, onDelete, onToggleActive }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kota / kecamatan..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Kota/Kabupaten</th>
                <th className="px-4 py-3 font-medium">Kecamatan</th>
                <th className="px-4 py-3 font-medium">Status Aktif</th>
                <th className="px-4 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {areas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    Tidak ada area ditemukan
                  </td>
                </tr>
              ) : (
                areas.map((area) => (
                  <tr key={area.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{area.city}</td>
                    <td className="px-4 py-3 text-muted-foreground">{area.kecamatan || '-'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onToggleActive(area.id, area.isActive)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          area.isActive ? 'bg-fresh-green' : 'bg-slate-200'
                        }`}
                        title={area.isActive ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                            area.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEdit(area)}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onDelete(area)}
                          title="Hapus"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
