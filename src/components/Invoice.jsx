import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { numberToWords } from "../utils/amountToWords";
import { COMPANY } from "../data/items";

export default function Invoice({ bill, onClose }) {
  const { billNumber, date, client, rows, gstType, gstRate } = bill;

  const subtotal = rows.reduce((sum, r) => {
    return sum + ((parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0));
  }, 0);

  const gstAmount = (subtotal * gstRate) / 100;
  const cgst = gstType === "cgst_sgst" ? gstAmount / 2 : 0;
  const sgst = gstType === "cgst_sgst" ? gstAmount / 2 : 0;
  const igst = gstType === "igst" ? gstAmount : 0;
  const grandTotal = subtotal + gstAmount;

  const handleDownloadPDF = async () => {
    const pages = document.querySelectorAll(".invoice-page");
    const pdf = new jsPDF("p", "px", [794, 1123]);

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      if (i !== 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, 794, 1123);
    }

    pdf.save(`Invoice-${billNumber}.pdf`);
  };

  const InvoiceContent = ({ title }) => (
    <div className="flex flex-col h-full justify-between">

      {/* HEADER */}
      <div>
        <h2 className="text-center font-bold text-sm mb-3">{title}</h2>

        <div className="flex flex-col sm:flex-row justify-between gap-3 text-sm mb-4">
          <div>
            <h2 className="text-lg font-bold">{COMPANY.name}</h2>
            <p>{COMPANY.address}</p>
            <p>GSTIN: {COMPANY.gstin}</p>
          </div>

          <div className="text-left sm:text-right">
            <p><strong>Invoice No:</strong> {billNumber}</p>
            <p><strong>Date:</strong> {date}</p>
          </div>
        </div>

        {/* CLIENT */}
        <div className="border p-3 mb-4 text-sm">
          <p className="font-bold">Bill To:</p>
          <p>{client?.company || client?.name || "Walk-in Customer"}</p>

          {client?.gstin && <p>GSTIN: {client.gstin}</p>}

          {client?.address && (
            <p className="break-words">
              {client.address}
              {client.city && `, ${client.city}`}
              {client.state && `, ${client.state}`}
            </p>
          )}
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border text-xs table-fixed min-w-[500px]">
            <thead>
              <tr>
                <th className="border px-2 py-1 w-8">#</th>
                <th className="border px-2 py-1 w-40">Item</th>
                <th className="border px-2 py-1 w-16">Qty</th>
                <th className="border px-2 py-1 w-20">Rate</th>
                <th className="border px-2 py-1 w-24">Amount</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => {
                const amount =
                  (parseFloat(row.qty) || 0) *
                  (parseFloat(row.rate) || 0);

                return (
                  <tr key={row.id}>
                    <td className="border text-center">{i + 1}</td>
                    <td className="border px-2 break-words">{row.particulars}</td>
                    <td className="border text-center">{row.qty}</td>
                    <td className="border text-right pr-2">{row.rate}</td>
                    <td className="border text-right pr-2">
                      ₹{amount.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="mt-6 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {gstType === "cgst_sgst" && (
            <>
              <div className="flex justify-between">
                <span>CGST:</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST:</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
            </>
          )}

          {gstType === "igst" && (
            <div className="flex justify-between">
              <span>IGST:</span>
              <span>₹{igst.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold mt-2 border-t pt-2">
            <span>Grand Total:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* WORDS */}
        <div className="mt-3 text-sm">
          <strong>Amount in Words:</strong><br />
          {numberToWords(grandTotal)}
        </div>
      </div>

      {/* SIGNATURE */}
      <div className="mt-8 flex justify-between text-sm">
        <div>
          <p>Received By:</p>
          <div className="mt-6 border-t w-32"></div>
        </div>

        <div className="text-right">
          <p>Authorized Signature</p>
          <div className="mt-6 border-t w-32 ml-auto"></div>
        </div>
      </div>

      <div className="mt-6 text-xs">
        This is a computer-generated invoice.
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center overflow-auto p-3">

      <div className="w-full max-w-[900px]">

        {/* SCALE FIX FOR MOBILE */}
        <div className="transform scale-[0.8] sm:scale-100 origin-top">

          <div id="invoice">

            <div className="invoice-page p-6 bg-white mb-4">
              <InvoiceContent title="CLIENT COPY" />
            </div>

            <div className="invoice-page p-6 bg-white">
              <InvoiceContent title="OFFICE COPY" />
            </div>

          </div>

        </div>

        {/* BUTTONS */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <button onClick={handleDownloadPDF} className="border px-4 py-2 text-sm w-full sm:w-auto">
            Download PDF
          </button>

          <button onClick={onClose} className="border px-4 py-2 text-sm w-full sm:w-auto">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}