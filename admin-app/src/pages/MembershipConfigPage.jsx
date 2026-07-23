import { useMembershipConfig } from '../hooks/useMembershipConfig';
import MembershipConfigForm from '../components/membership/MembershipConfigForm';

export default function MembershipConfigPage() {
  const { config, isLoading, isSubmitting, error, handleUpdate } = useMembershipConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-500">Memuat konfigurasi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Membership Config</h2>
          <p className="text-sm text-slate-500 mt-1">Konfigurasi parameter member dan diskon</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Membership Config</h2>
        <p className="text-sm text-slate-500 mt-1">Konfigurasi parameter member dan diskon</p>
      </div>

      <MembershipConfigForm
        config={config}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
