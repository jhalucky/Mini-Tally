import React, { useState } from 'react';
import InvoiceForm, { BLANK_ROW } from '../components/InvoiceForm';
import Invoice from '../components/Invoice';
import ClientManager from '../components/ClientManager';
import ProductManager from '../components/ProductManager';
import { useBillNumber } from '../hooks/useBillNumber';
import { calcInvoiceTotals, formatINR } from '../utils/gstUtils';
import { COMPANY } from '../data/items';
import { Search, X, MapPin } from 'lucide-react';

export default function Home() {
  const [tab, setTab] = useState('billing');
  const [rows, setRows] = useState([BLANK_ROW()]);
  const [client, setClient] = useState(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [activeBill, setActiveBill] = useState(null);
  const [gstData, setGSTData] = useState({});

  const { getNextBillNumber, confirmBillNumber } = useBillNumber();

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const totals = calcInvoiceTotals(
    rows.map(r => ({
      ...r,
      qty: parseFloat(r.qty)||0,
      rate: parseFloat(r.rate)||0,
      gstRate: parseFloat(r.gstRate)||0
    }))
  );

  const handleGenerateInvoice = () => {
    const filled = rows.filter(
      r => r.particulars?.trim() && parseFloat(r.rate) > 0
    );
    if (filled.length === 0) return alert('Fill at least one row (particulars and rate required)');

    const billNumber = confirmBillNumber();

    setActiveBill({
      billNumber,
      date: today,
      client,
      rows: filled,
      gstType: gstData.gstType,
      gstRate: gstData.gstRate
    });
  };

  const handleNewBill = () => {
    setRows([BLANK_ROW()]);
    setClient(null);
    setActiveBill(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 w-full overflow-x-hidden">

      {/* HEADER */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 flex flex-col sm:flex-row justify-between gap-3">

          {/* LEFT */}
          <div>
            <div className="text-xs text-gray-400 uppercase">GST Billing System</div>
            <div className="font-bold text-lg">{COMPANY.name}</div>
            <div className="text-xs text-gray-400 break-words">
              GSTIN: {COMPANY.gstin}
            </div>
          </div>

          {/* RIGHT */}
          <div className="text-left sm:text-right">
            <div className="text-xs text-gray-400 uppercase">Next Invoice</div>
            <div className="font-bold text-orange-400 text-xl sm:text-2xl">
              {getNextBillNumber()}
            </div>
            <div className="text-xs text-gray-400">{today}</div>
          </div>
        </div>

        {/* TABS */}
        <div className="overflow-x-auto">
          <div className="max-w-5xl mx-auto w-full px-3 sm:px-4 flex">
            {[
              { id: 'billing', label: '📄 Bill' },
              { id: 'clients', label: '👥 Clients' },
              { id: 'products', label: '📦 Products' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 ${
                  tab === t.id
                    ? 'border-orange-400 text-orange-400'
                    : 'border-transparent text-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* BILLING */}
      {tab === 'billing' && (
        <main className="max-w-5xl mx-auto w-full px-2 sm:px-4 py-5 space-y-4">

          {/* CLIENT */}
          <div className="bg-white border p-4">

            <div className="flex flex-col sm:flex-row justify-between gap-2 mb-3">
              <h2 className="text-xs uppercase text-gray-500">Client</h2>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowClientPicker(true)}
                  className="border px-3 py-2 text-xs flex items-center gap-1 w-full sm:w-auto"
                >
                  <Search size={12} /> Select
                </button>

                {client && (
                  <button onClick={() => setClient(null)}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {client ? (
              <div className="border p-3 text-sm">
                <div className="font-bold break-words">
                  {client.company || client.name}
                </div>

                <div className="text-xs text-gray-500 break-words mt-1">
                  {client.address} {client.city && `, ${client.city}`}
                </div>

                <div className="flex flex-wrap gap-2 text-xs mt-1">
                  {client.gstin && <span>GSTIN: {client.gstin}</span>}
                  {client.state && (
                    <span className="flex items-center gap-1">
                      <MapPin size={10} /> {client.state}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-dashed border text-center py-4 text-xs text-gray-400">
                No client selected
              </div>
            )}
          </div>

          {/* ITEMS */}
          <InvoiceForm rows={rows} setRows={setRows} setGSTData={setGSTData} />

          {/* TOTALS */}
          <div className="bg-white border p-4">

            <div className="flex flex-col gap-3">

              <div className="text-sm space-y-1 break-words">
                <div>Subtotal: {formatINR(totals.subtotal)}</div>
                {totals.totalCGST > 0 && <div>CGST: {formatINR(totals.totalCGST)}</div>}
                {totals.totalSGST > 0 && <div>SGST: {formatINR(totals.totalSGST)}</div>}
                {totals.totalIGST > 0 && <div>IGST: {formatINR(totals.totalIGST)}</div>}
                <div className="font-bold text-lg text-orange-600">
                  Total: {formatINR(totals.grandTotal)}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleNewBill}
                  className="border px-4 py-3 text-sm w-full"
                >
                  Clear
                </button>

                <button
                  onClick={handleGenerateInvoice}
                  className="bg-orange-600 text-white px-4 py-3 text-sm w-full"
                >
                  Generate Invoice
                </button>
              </div>

            </div>
          </div>

        </main>
      )}

      {/* CLIENTS */}
      {tab === 'clients' && (
        <main className="max-w-5xl mx-auto w-full px-2 sm:px-4 py-5">
          <ClientManager
            selectorMode
            onSelect={(c) => { setClient(c); setShowClientPicker(false); }}
            onClose={() => setShowClientPicker(false)}
          />
        </main>
      )}

      {/* PRODUCTS */}
      {tab === 'products' && (
        <main className="max-w-5xl mx-auto w-full px-2 sm:px-4 py-5">
          <ProductManager />
        </main>
      )}

      {/* CLIENT MODAL */}
      {showClientPicker && (
  <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto">

    <div className="min-h-screen flex items-center justify-center px-2">

      <div className="bg-white w-full max-w-2xl p-3 sm:p-4 relative">

        {/* 🔥 CLOSE BUTTON */}
        <button
          onClick={() => setShowClientPicker(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
          ✕
        </button>

        {/* CONTENT */}
        <ClientManager
          selectorMode
          onSelect={(c) => {
            setClient(c);
            setShowClientPicker(false);
          }}
          onClose={() => setShowClientPicker(false)}
        />

      </div>

    </div>
  </div>
)}

      {/* INVOICE MODAL */}
      {activeBill && (
        <Invoice
          bill={activeBill}
          onClose={() => setActiveBill(null)}
          onNewBill={handleNewBill}
        />
      )}
    </div>
  );
}