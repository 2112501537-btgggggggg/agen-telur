import { useSalesReport } from '../../hooks/useSalesReport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatCurrency(amount) {
  if (amount == null) return 'Rp0';
  return `Rp${Number(amount).toLocaleString('id-ID')}`;
}

export default function SalesReportTab({ dateRange }) {
  const { data, totalRevenue, totalDays, isLoading, error } = useSalesReport(dateRange);

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Memuat data penjualan...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hari dengan Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDays} hari</div>
          </CardContent>
        </Card>
      </div>

      {data.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-muted-foreground">
          Tidak ada data penjualan pada periode ini
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800">Penjualan Harian</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.date} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.totalSales)}</td>
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
