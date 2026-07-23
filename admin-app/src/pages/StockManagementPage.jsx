import { useState } from 'react';
import StockInTab from '@/components/stock/StockInTab';
import StockAdjustmentTab from '@/components/stock/StockAdjustmentTab';
import SupplierTab from '@/components/stock/SupplierTab';

const TABS = [
  { key: 'stock-in', label: 'Stok Masuk' },
  { key: 'adjustment', label: 'Adjustment Stok' },
  { key: 'supplier', label: 'Supplier' },
];

export default function StockManagementPage() {
  const [activeTab, setActiveTab] = useState('stock-in');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Kelola Stok & Supplier</h2>

      <div className="border-b">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-egg-yolk text-egg-yolk'
                  : 'border-transparent text-neutral-gray hover:text-barn-brown hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeTab === 'stock-in' && <StockInTab />}
        {activeTab === 'adjustment' && <StockAdjustmentTab />}
        {activeTab === 'supplier' && <SupplierTab />}
      </div>
    </div>
  );
}
