import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { formatRupiah } from '../lib/format';
import StatCard from '../components/dashboard/StatCard';
import OrdersByStatusSection from '../components/dashboard/OrdersByStatusSection';
import LowStockSection from '../components/dashboard/LowStockSection';
import SalesTrendChart from '../components/dashboard/SalesTrendChart';
import { DollarSign, CalendarDays } from 'lucide-react';

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 bg-slate-100 rounded" />
        <div className="h-6 w-20 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
      <div className="h-4 w-40 bg-slate-100 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-10 bg-slate-100 rounded" />
        <div className="h-10 bg-slate-100 rounded" />
        <div className="h-10 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, salesData, isLoading, error, refetch } = useDashboardSummary();

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-alert-red text-sm mb-3">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-egg-yolk text-white rounded-lg text-sm font-medium hover:bg-warm-amber transition-colors"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Pendapatan Hari Ini"
              value={formatRupiah(data?.salesToday || 0)}
              icon={DollarSign}
            />
            <StatCard
              label="Pendapatan Bulan Ini"
              value={formatRupiah(data?.salesThisMonth || 0)}
              icon={CalendarDays}
            />
          </>
        )}
      </div>

      {/* Orders by Status */}
      {isLoading ? (
        <SectionSkeleton />
      ) : (
        <OrdersByStatusSection ordersByStatus={data?.ordersByStatus} />
      )}

      {/* Sales Trend Chart */}
      {isLoading ? (
        <SectionSkeleton />
      ) : (
        <SalesTrendChart salesData={salesData} />
      )}

      {/* Low Stock */}
      {isLoading ? (
        <SectionSkeleton />
      ) : (
        <LowStockSection lowStockVariants={data?.lowStockVariants} />
      )}
    </div>
  );
}
