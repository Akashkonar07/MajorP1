import React, { useState } from 'react';
import { SHOP_REASONS, adjustShopStock } from '../../lib/shopInventory';

// Record a shop stock change: received / sold / returned / damaged, or set the exact count
const ShopStockAction = ({ item, onDone, initialReason = 'sold' }) => {
  const [reason, setReason] = useState(initialReason);
  const [amount, setAmount] = useState(reason === 'adjustment' ? String(item.qty) : '1');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = r => {
    setReason(r);
    setAmount(r === 'adjustment' ? String(item.qty) : '1');
    setError('');
  };

  const save = async () => {
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 0 || (reason !== 'adjustment' && n === 0)) {
      setError(reason === 'adjustment' ? 'Enter the correct count (0 or more)' : 'Enter how many pieces (1 or more)');
      return;
    }
    const change = reason === 'adjustment' ? n - item.qty : SHOP_REASONS[reason].sign * n;
    if (change === 0) { setError('The count is already ' + item.qty); return; }
    setBusy(true);
    setError('');
    try {
      await adjustShopStock(item.id, change, reason, note.trim() || (reason === 'adjustment' ? `Counted ${n}` : ''));
      await onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(SHOP_REASONS).map(([key, r]) => (
          <button key={key} type="button" onClick={() => pick(key)} title={r.hint}
            className={`px-3 py-1.5 rounded-full border font-body text-xs transition-colors ${
              reason === key ? 'bg-maroon-900 text-white border-maroon-900' : 'bg-white text-charcoal border-gray-200 hover:border-maroon-900'}`}>
            {key === 'adjustment' ? 'Correct count' : r.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="font-body text-xs text-gray-600">
          {reason === 'adjustment' ? 'Correct count' : 'Pieces'}
          <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="numeric"
            className="block w-20 mt-1 border border-gray-200 rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-maroon-900" />
        </label>
        <label className="font-body text-xs text-gray-600 flex-1 min-w-[140px]">
          Note (optional)
          <input value={note} onChange={e => setNote(e.target.value)} maxLength={300} placeholder="e.g. from Surat supplier"
            className="block w-full mt-1 border border-gray-200 rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-maroon-900" />
        </label>
        <button type="button" onClick={save} disabled={busy} className="btn-primary !py-2 disabled:opacity-50">
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="font-body text-[11px] text-gray-500">In shop now: <span className="font-semibold">{item.qty}</span></p>
      {error && <p className="font-body text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default ShopStockAction;
