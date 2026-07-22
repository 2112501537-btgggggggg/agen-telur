import { cn } from '@/lib/utils';

export default function StatCard({ label, value, icon: Icon, highlight }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm p-5 flex items-center gap-4',
        highlight && 'ring-2 ring-egg-yolk/50'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          highlight ? 'bg-egg-yolk/15' : 'bg-slate-100'
        )}
      >
        <Icon size={22} className={highlight ? 'text-egg-yolk' : 'text-slate-500'} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}
