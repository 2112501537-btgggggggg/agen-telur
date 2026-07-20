export default function AddressCard({ address, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2 border-l-4 border-l-egg-yolk">
      {/* Label + Badge Default */}
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-barn-brown">{address.label}</h3>
        {address.isDefault && (
          <span className="bg-egg-yolk text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Default
          </span>
        )}
      </div>

      {/* Alamat */}
      <p className="text-sm text-neutral-600">{address.fullAddress}</p>
      <p className="text-xs text-neutral-400">
        {address.kecamatan}, {address.city}
      </p>

      {/* Actions */}
      <div className="flex gap-3 mt-2 pt-2 border-t border-neutral-100">
        <button
          onClick={() => onEdit(address)}
          className="text-sm text-egg-yolk hover:text-warm-amber font-medium transition"
        >
          Edit
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Hapus alamat "${address.label}"?`)) {
              onDelete(address.id);
            }
          }}
          className="text-sm text-alert-red hover:text-red-700 font-medium transition"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}
