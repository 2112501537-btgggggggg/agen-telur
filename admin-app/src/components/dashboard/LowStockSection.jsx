import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';

export default function LowStockSection({ lowStockVariants }) {
  if (!lowStockVariants) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="font-semibold text-slate-800 mb-4">Stok Menipis</h3>

      {lowStockVariants.length === 0 ? (
        <div className="flex items-center gap-2 text-fresh-green text-sm py-4">
          <AlertTriangle size={16} />
          Semua stok aman.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Sisa Stok (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockVariants.map((item, idx) => {
                const isLow = item.stockKg < item.lowStockThreshold;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.grade}</TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        isLow ? 'text-alert-red' : 'text-slate-700'
                      }`}
                    >
                      {item.stockKg}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
