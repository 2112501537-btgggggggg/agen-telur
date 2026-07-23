import { useState } from 'react';
import { format, subDays } from 'date-fns';
import DateRangeFilter from '../components/reports/DateRangeFilter';
import SalesReportTab from '../components/reports/SalesReportTab';
import DamagedReportTab from '../components/reports/DamagedReportTab';

const TABS = [
  { value: 'sales', label: 'Laporan Penjualan' },
  { value: 'damaged', label: 'Laporan Telur Cacat' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Laporan</h2>
        <p className="text-sm text-slate-500 mt-1">Analisis penjualan dan kerusakan produk</p>
      </div>

      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      <div className="border-b">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.value
                  ? 'border-egg-yolk text-egg-yolk'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'sales' && <SalesReportTab dateRange={dateRange} />}
      {activeTab === 'damaged' && <DamagedReportTab />}
    </div>
  );
}
