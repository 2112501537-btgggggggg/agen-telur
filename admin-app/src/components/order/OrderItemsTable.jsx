function formatCurrency(amount) {
  if (amount == null) return 'Rp0';
  return `Rp${Number(amount).toLocaleString('id-ID')}`;
}

export default function OrderItemsTable({ items, subtotalAmount, discountAmount, totalAmount }) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Produk</th>
              <th className="pb-2 font-medium">Grade</th>
              <th className="pb-2 font-medium text-right">Qty</th>
              <th className="pb-2 font-medium text-right">Harga/kg</th>
              <th className="pb-2 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2">{item.productName || '-'}</td>
                <td className="py-2">{item.grade || '-'}</td>
                <td className="py-2 text-right">
                  {item.quantity != null ? `${item.quantity} ${item.unit || 'kg'}` : '-'}
                </td>
                <td className="py-2 text-right">{formatCurrency(item.pricePerKg)}</td>
                <td className="py-2 text-right">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
            {(!items || items.length === 0) && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                  Tidak ada item
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-end gap-1 text-sm">
        <div className="flex gap-8">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotalAmount)}</span>
        </div>
        {(discountAmount != null && discountAmount > 0) && (
          <div className="flex gap-8 text-green-600">
            <span>Diskon</span>
            <span className="font-medium">-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex gap-8 text-base font-bold border-t pt-1">
          <span>Total</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
