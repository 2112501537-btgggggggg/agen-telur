import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatRupiahShort, formatDate } from '@/lib/format';

export default function SalesTrendChart({ salesData }) {
  if (!salesData || salesData.length === 0) return null;

  const chartData = salesData.map((d) => ({
    date: formatDate(d.date),
    revenue: Number(d.totalSales),
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="font-semibold text-slate-800 mb-4">Tren Penjualan (7 Hari)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis
              tickFormatter={(v) => formatRupiahShort(v)}
              tick={{ fontSize: 12, fill: '#64748b' }}
              width={60}
            />
            <Tooltip
              formatter={(value) => [`Rp${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
              labelStyle={{ color: '#334155' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#F5A623"
              strokeWidth={2}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
