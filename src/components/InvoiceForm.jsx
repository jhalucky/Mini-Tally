import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getProducts } from "../db/database";

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

export default function InvoiceForm({ rows, setRows, setGSTData }) {
  const products = getProducts();

  const [gstType, setGstType] = useState("cgst_sgst");
  const [gstRate, setGstRate] = useState(18);

  const addRow = () => setRows((r) => [...r, BLANK_ROW()]);
  const removeRow = (id) => setRows((r) => r.filter((row) => row.id !== id));

  const updateRow = (id, key, value) => {
    setRows((r) =>
      r.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    );
  };

  const subtotal = rows.reduce((sum, r) => {
    const qty = r.qty === "" || r.qty === undefined ? 1 : parseFloat(r.qty) || 1;
    return sum + (qty * (parseFloat(r.rate) || 0));
  }, 0);

  const gstAmount = (subtotal * gstRate) / 100;
  const cgst = gstType === "cgst_sgst" ? gstAmount / 2 : 0;
  const sgst = gstType === "cgst_sgst" ? gstAmount / 2 : 0;
  const igst = gstType === "igst" ? gstAmount : 0;

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

      {/* 🔥 RESPONSIVE TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-xs border-collapse table-fixed">

          <thead>
            <tr className="border-b border-black">
              <th className="px-2 py-2 border">#</th>
              <th className="px-2 py-2 border">Particulars</th>
              <th className="px-2 py-2 border">Qty</th>
              <th className="px-2 py-2 border">Rate</th>
              <th className="px-2 py-2 border">Amount</th>
              <th className="px-2 py-2 border"></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => {
              // qty defaults to 1 when left blank — amount = rate if no qty entered
              const qty = row.qty === "" || row.qty === undefined ? 1 : parseFloat(row.qty) || 1;
              const amount = qty * (parseFloat(row.rate) || 0);

              return (
                <tr key={row.id} className="border-b">

                  <td className="text-center border px-1">{idx + 1}</td>

                  <td className="border px-2 break-words">
                    <select
                      value={row.particulars}
                      onChange={(e) => {
                        const product = products.find(p => p.name === e.target.value);
                        if (!product) return;
                        updateRow(row.id, "particulars", product.name);
                        updateRow(row.id, "rate", product.price);
                      }}
                      className="w-full min-w-[120px] border px-2 py-1"
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
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

      {/* 🔥 RESPONSIVE GST */}
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
          <span>CGST:</span>
          <span>₹{cgst.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>SGST:</span>
          <span>₹{sgst.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-bold mt-2 border-t pt-2">
          <span>Grand Total:</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>

      </div>
    </div>
  );
}