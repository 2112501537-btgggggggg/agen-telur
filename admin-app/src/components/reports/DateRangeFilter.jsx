import { useState } from 'react';
import { format, subDays, startOfMonth } from 'date-fns';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const PRESETS = [
  { value: '7d', label: '7 Hari Terakhir' },
  { value: '30d', label: '30 Hari Terakhir' },
  { value: 'thisMonth', label: 'Bulan Ini' },
  { value: 'custom', label: 'Custom' },
];

function getPresetRange(preset) {
  const now = new Date();
  const to = format(now, 'yyyy-MM-dd');
  let from;

  switch (preset) {
    case '7d':
      from = format(subDays(now, 6), 'yyyy-MM-dd');
      break;
    case '30d':
      from = format(subDays(now, 29), 'yyyy-MM-dd');
      break;
    case 'thisMonth':
      from = format(startOfMonth(now), 'yyyy-MM-dd');
      break;
    default:
      from = format(subDays(now, 6), 'yyyy-MM-dd');
  }

  return { from, to };
}

export default function DateRangeFilter({ value, onChange }) {
  const [preset, setPreset] = useState('7d');

  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      onChange(getPresetRange(newPreset));
    }
  };

  const handleFromChange = (e) => {
    onChange({ from: e.target.value, to: value.to });
  };

  const handleToChange = (e) => {
    onChange({ from: value.from, to: e.target.value });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Pilih periode" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === 'custom' && (
        <>
          <Input
            type="date"
            value={value.from}
            onChange={handleFromChange}
            className="w-[150px]"
          />
          <span className="text-muted-foreground">s/d</span>
          <Input
            type="date"
            value={value.to}
            onChange={handleToChange}
            className="w-[150px]"
          />
        </>
      )}
    </div>
  );
}
