import { useState, useRef, useEffect } from 'react';
import { Loader2Icon } from 'lucide-react';

export default function PriceEditableCell({ value, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setInputValue(String(Number(value) || ''));
    setErrorMsg('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleConfirm = async () => {
    const num = Number(inputValue);
    if (!inputValue || isNaN(num) || num <= 0) {
      setErrorMsg('Harga harus lebih dari 0');
      return;
    }
    if (num === Number(value)) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const result = await onSave(num);
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
    } else {
      setErrorMsg(result.message || 'Gagal menyimpan');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    else if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setErrorMsg(''); }}
            onKeyDown={handleKeyDown}
            onBlur={handleConfirm}
            disabled={isSaving}
            className="w-28 h-7 px-2 text-sm rounded border border-egg-yolk outline-none focus:ring-2 focus:ring-egg-yolk/30"
          />
          {isSaving && <Loader2Icon className="size-4 animate-spin text-egg-yolk" />}
        </div>
        {errorMsg && <span className="text-xs text-alert-red">{errorMsg}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      className="text-left px-2 py-1 rounded hover:bg-straw-yellow/50 transition-colors cursor-text font-medium"
    >
      Rp{Number(value).toLocaleString('id-ID')}
    </button>
  );
}
