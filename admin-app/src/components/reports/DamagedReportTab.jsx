import { useDamagedReport } from '../../hooks/useDamagedReport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DamagedReportTab() {
  const { data, totalDamaged, isLoading, error } = useDamagedReport();

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Memuat data kerusakan...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Telur Cacat Dilaporkan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDamaged} butir</div>
        </CardContent>
      </Card>

      {data.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
          <p className="text-lg font-medium text-green-600">Tidak ada laporan telur cacat</p>
          <p className="text-sm text-muted-foreground mt-1">Semua produk dalam kondisi baik pada periode ini</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800">Kerusakan per Produk</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium text-right">Jumlah Cacat</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.productId} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{row.productName}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {row.totalDamaged} butir
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
