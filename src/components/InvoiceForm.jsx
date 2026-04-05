import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getProducts, saveProduct } from "../db/database";

const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 9, 12, 14, 18, 28];

export const BLANK_ROW = () => ({
  id: Date.now() + Math.random(),
  particulars: "",
  qty: "",
  rate: "",
});

function NumCell({ value, onChange }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border px-2 py-1 text-xs text-right outline-none"
    />
  );
}

/**
 * ParticularsCell
 * ---------------
 * A free-text input with a dropdown suggestion list from saved products.
 * - User can type anything freely — no need to visit Products tab first.
 * - As they type, matching saved products appear as suggestions.
 * - Selecting a suggestion auto-fills the rate.
 * - If they type a new name (not in products), it's just used as-is.
 * - Optionally saves new typed products to the store for future use.
 */
function ParticularsCell({ value, rate, onChangeParticulars, onChangeRate }) {
  const [query, setQuery]       = useState(value || "");
  const [open, setOpen]         = useState(false);
  const [products, setProducts] = useState(getProducts());
  const wrapRef                 = useRef(null);

  // keep query in sync if parent resets the row
  useEffect(() => { setQuery(value || ""); }, [value]);

  // close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? products.filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : products;

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChangeParticulars(val);
    setOpen(true);
  };

  const handleSelect = (product) => {
    setQuery(product.name);
    onChangeParticulars(product.name);
    onChangeRate(product.price);
    setOpen(false);
  };

  const handleBlur = () => {
    // small delay so click on suggestion registers first
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder="Type or select product..."
        className="w-full border px-2 py-1 text-xs outline-none"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-50 bg-white border border-gray-300 shadow-lg w-full max-h-40 overflow-y-auto">
          {filtered.map(p => (
            <div
              key={p.id}
              onMouseDown={() => handleSelect(p)}
              className="px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-100 flex justify-between gap-2"
            >
              <span>{p.name}</span>
              <span className="text-gray-400">₹{p.price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InvoiceForm({ rows, setRows, setGSTData }) {
  const [gstType, setGstType] = useState("cgst_sgst");
  const [gstRate, setGstRate] = useState(18);

  const addRow    = () => setRows((r) => [...r, BLANK_ROW()]);
  const removeRow = (id) => setRows((r) => r.filter((row) => row.id !== id));

  const updateRow = (id, key, value) => {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const subtotal = rows.reduce((sum, r) => {
    const qty = r.qty === "" || r.qty === undefined ? 1 : parseFloat(r.qty) || 1;
    return sum + (qty * (parseFloat(r.rate) || 0));
  }, 0);

  const gstAmount  = (subtotal * gstRate) / 100;
  const cgst       = gstType === "cgst_sgst" ? gstAmount / 2 : 0;
  const sgst       = gstType === "cgst_sgst" ? gstAmount / 2 : 0;
  const igst       = gstType === "igst" ? gstAmount : 0;
  const grandTotal = subtotal + gstAmount;

  React.useEffect(() => {
    setGSTData?.({ gstType, gstRate });
  }, [gstType, gstRate]);

  return (
    <div className="bg-white border border-black">

      {/* Header */}
      <div className="bg-black text-white px-4 py-2 flex justify-between">
        <span className="text-xs uppercase">Invoice Items</span>
        <button onClick={addRow} className="border border-white px-3 py-1 text-xs flex items-center gap-1">
          <Plus size={12} /> Add Row
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-xs border-collapse table-fixed">
          <thead>
            <tr className="border-b border-black">
              <th className="px-2 py-2 border w-8">#</th>
              <th className="px-2 py-2 border">Particulars</th>
              <th className="px-2 py-2 border w-20">Qty</th>
              <th className="px-2 py-2 border w-24">Rate</th>
              <th className="px-2 py-2 border w-24">Amount</th>
              <th className="px-2 py-2 border w-8"></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => {
              const qty    = row.qty === "" || row.qty === undefined ? 1 : parseFloat(row.qty) || 1;
              const amount = qty * (parseFloat(row.rate) || 0);

              return (
                <tr key={row.id} className="border-b">
                  <td className="text-center border px-1">{idx + 1}</td>

                  <td className="border px-1">
                    <ParticularsCell
                      value={row.particulars}
                      rate={row.rate}
                      onChangeParticulars={(v) => updateRow(row.id, "particulars", v)}
                      onChangeRate={(v) => updateRow(row.id, "rate", v)}
                    />
                  </td>

                  <td className="border px-1">
                    <NumCell value={row.qty} onChange={(v) => updateRow(row.id, "qty", v)} />
                  </td>

                  <td className="border px-1">
                    <NumCell value={row.rate} onChange={(v) => updateRow(row.id, "rate", v)} />
                  </td>

                  <td className="border text-right px-2">
                    {amount ? `₹${amount.toFixed(2)}` : "-"}
                  </td>

                  <td className="border text-center">
                    <button onClick={() => removeRow(row.id)}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GST section */}
      <div className="p-4 border-t text-sm w-full">
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <select value={gstType} onChange={(e) => setGstType(e.target.value)} className="border px-2 py-1">
            <option value="cgst_sgst">CGST + SGST</option>
            <option value="igst">IGST</option>
          </select>
          <select value={gstRate} onChange={(e) => setGstRate(Number(e.target.value))} className="border px-2 py-1">
            {GST_RATES.map(r => (
              <option key={r} value={r}>{r}%</option>
            ))}
          </select>
        </div>

        <div className="flex justify-between">
          <span>CGST:</span><span>₹{cgst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>SGST:</span><span>₹{sgst.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-bold mt-2 border-t pt-2">
          <span>Grand Total:</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}