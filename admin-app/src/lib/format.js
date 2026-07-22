export function formatRupiah(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

export function formatRupiahShort(value) {
  const num = Number(value);
  if (num >= 1_000_000) return `${(num / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}jt`;
  if (num >= 1_000) return `${(num / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}rb`;
  return formatRupiah(num);
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
