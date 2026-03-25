import React from "react";
import jsPDF from "jspdf";
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


const handleDownloadPDF = () => {
  const pdf = new jsPDF("p", "mm", "a4");

  const margin = 10;
  const pageWidth = 210;
  let y = 10;

  const line = () => {
    pdf.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  const rightText = (text, yPos) => {
    pdf.text(text, pageWidth - margin, yPos, { align: "right" });
  };

  const drawInvoice = (title) => {
    y = 10;

    // TITLE
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(title, pageWidth / 2, y, { align: "center" });
    y += 6;

    // COMPANY
    pdf.setFontSize(14);
    pdf.text("PC Labels", margin, y);
    y += 5;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Z-32, Okhla Industrial Area, Phase 2, New Delhi", margin, y);
    y += 4;
    pdf.text("GSTIN: 07AABCS1429B1Z1", margin, y);

    // INVOICE INFO
    rightText(`Invoice No: ${billNumber}`, y - 4);
    rightText(`Date: ${date}`, y);

    y += 6;
    line();

    // CLIENT BOX
    pdf.setFont("helvetica", "bold");
    pdf.text("Bill To:", margin, y);
    y += 5;

    pdf.setFont("helvetica", "normal");

    pdf.text(client?.company || client?.name || "Walk-in Customer", margin, y);
    y += 4;

    if (client?.gstin) {
      pdf.text(`GSTIN: ${client.gstin}`, margin, y);
      y += 4;
    }

    if (client?.address) {
      const splitAddress = pdf.splitTextToSize(client.address, 180);
      pdf.text(splitAddress, margin, y);
      y += splitAddress.length * 4;
    }

    y += 2;
    line();

    // TABLE HEADER
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    pdf.text("#", margin, y);
    pdf.text("Item", margin + 10, y);
    pdf.text("Qty", margin + 110, y);
    pdf.text("Rate", margin + 130, y);
    pdf.text("Amount", margin + 160, y);

    y += 2;
    line();

    // TABLE ROWS
    pdf.setFont("helvetica", "normal");

    rows.forEach((r, i) => {
      const amount = r.qty * r.rate;

      pdf.text(String(i + 1), margin, y);

      const itemText = pdf.splitTextToSize(r.particulars, 90);
      pdf.text(itemText, margin + 10, y);

      pdf.text(String(r.qty), margin + 110, y, { align: "right" });
      pdf.text(String(r.rate), margin + 130, y, { align: "right" });
      pdf.text(`₹${amount.toFixed(2)}`, margin + 180, y, { align: "right" });

      y += itemText.length * 5;
    });

    y += 2;
    line();

    // TOTALS
    pdf.setFont("helvetica", "normal");

    pdf.text("Subtotal:", margin, y);
    rightText(`₹${subtotal.toFixed(2)}`, y);
    y += 5;

    if (gstType === "cgst_sgst") {
      pdf.text("CGST:", margin, y);
      rightText(`₹${cgst.toFixed(2)}`, y);
      y += 5;

      pdf.text("SGST:", margin, y);
      rightText(`₹${sgst.toFixed(2)}`, y);
      y += 5;
    } else {
      pdf.text("IGST:", margin, y);
      rightText(`₹${igst.toFixed(2)}`, y);
      y += 5;
    }

    pdf.setFont("helvetica", "bold");
    pdf.text("Grand Total:", margin, y);
    rightText(`₹${grandTotal.toFixed(2)}`, y);
    y += 6;

    line();

    // AMOUNT IN WORDS
    pdf.setFont("helvetica", "normal");
    pdf.text("Amount in Words:", margin, y);
    y += 4;

    const words = numberToWords(grandTotal);
    const splitWords = pdf.splitTextToSize(words, 180);
    pdf.text(splitWords, margin, y);
    y += splitWords.length * 4 + 4;

    // SIGNATURES
    pdf.text("Received By:", margin, y + 10);
    pdf.text("Authorized Signature", pageWidth - margin, y + 10, { align: "right" });

    pdf.line(margin, y + 18, margin + 60, y + 18);
    pdf.line(pageWidth - margin - 60, y + 18, pageWidth - margin, y + 18);

    // FOOTER
    y += 25;
    pdf.setFontSize(8);
    pdf.text("This is a computer-generated invoice.", margin, y);
  };

  // PAGE 1
  drawInvoice("CLIENT COPY");

  // PAGE 2
  pdf.addPage();
  drawInvoice("OFFICE COPY");

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