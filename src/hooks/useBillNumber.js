/**
 * useBillNumber.js
 * ----------------
 * Auto-incrementing bill number using localStorage.
 * Format: INV-001, INV-002 ...
 *
 * getNextBillNumber() → preview only, does NOT increment
 * confirmBillNumber() → increments counter, saves to localStorage, returns number
 */
import { useState } from 'react';

const KEY    = 'gst_bill_counter';
const PREFIX = 'INV';
const fmt    = (n) => `${PREFIX}-${String(n).padStart(3, '0')}`;

export function useBillNumber() {
  const getCounter = () => {
    const v = localStorage.getItem(KEY);
    return v ? parseInt(v, 10) : 0;
  };

  const [counter, setCounter] = useState(getCounter);

  const getNextBillNumber  = () => fmt(counter + 1);

  const confirmBillNumber  = () => {
    const next = counter + 1;
    localStorage.setItem(KEY, String(next));
    setCounter(next);
    return fmt(next);
  };

  const resetCounter = () => {
    localStorage.removeItem(KEY);
    setCounter(0);
  };

  return { getNextBillNumber, confirmBillNumber, resetCounter };
}
