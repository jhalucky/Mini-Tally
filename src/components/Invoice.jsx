/**
 * Invoice.jsx
 * -----------
 * DATA FLOW (matches your InvoiceForm.jsx exactly):
 *   bill.rows     -> [{ particulars, qty, rate }]
 *   bill.gstType  -> 'cgst_sgst' | 'igst'
 *   bill.gstRate  -> number e.g. 18
 *   bill.client   -> client object or null
 *   bill.billNumber, bill.date
 *
 * PDF via jsPDF draws directly to the PDF canvas.
 * Two pages: Page 1 = CLIENT COPY, Page 2 = OFFICE COPY.
 */

import React from "react";
import jsPDF from "jspdf";
import { numberToWords } from "../utils/amountToWords";
import { COMPANY } from "../data/items";

const f2 = (n) => (parseFloat(n) || 0).toFixed(2);
const Rs = (n) => "Rs. " + f2(n);

function splitText(pdf, text, maxW) {
  return pdf.splitTextToSize(String(text || ""), maxW);
}

function drawInvoicePage(pdf, bill, copyLabel) {
  const { billNumber, date, client, rows, gstType, gstRate } = bill;

  const PW = 210;
  const ML = 10;
  const MR = 10;
  const CW = PW - ML - MR;
  const RX = PW - MR;

  const rt = (txt, y) => pdf.text(String(txt), RX, y, { align: "right" });
  const hr = (y) => {
    pdf.setDrawColor(0, 0, 0);
    pdf.line(ML, y, RX, y);
  };

  let y = 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  rt(copyLabel, y + 4);
  y += 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(COMPANY.name, ML, y);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  rt("TAX INVOICE", y);
  y += 5;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  const cLines = [
    COMPANY.address + ", " + COMPANY.city,
    "GSTIN: " + COMPANY.gstin + "  |  State: " + COMPANY.state + " (" + COMPANY.stateCode + ")",
    "Ph: " + COMPANY.phone + "  |  " + COMPANY.email,
  ];
  const metaY = y;
  cLines.forEach((line) => {
    pdf.text(line, ML, y);
    y += 4;
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  rt("Invoice No: " + billNumber, metaY);
  rt("Date: " + date, metaY + 5);

  y += 2;
  hr(y);
  y += 5;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Bill To:", ML, y);
  y += 5;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(client?.company || client?.name || "Walk-in Customer", ML, y);
  pdf.setFont("helvetica", "normal");
  y += 4.5;

  if (client?.name && client?.company && client.name !== client.company) {
    pdf.text(client.name, ML, y);
    y += 4.5;
  }
  if (client?.gstin) {
    pdf.text("GSTIN: " + client.gstin, ML, y);
    y += 4.5;
  }
  if (client?.address) {
    const parts = [client.address, client.city, client.state].filter(Boolean).join(", ");
    const addressLines = splitText(pdf, parts, CW);
    pdf.text(addressLines, ML, y);
    y += addressLines.length * 4.5;
  }
  if (client?.phone) {
    pdf.text("Ph: " + client.phone, ML, y);
    y += 4.5;
  }

  y += 2;
  hr(y);
  y += 5;

  const isIGST = gstType === "igst";
  const gstPct = parseFloat(gstRate) || 0;

  const C = isIGST
    ? {
        no: ML,
        part: ML + 8,
        qty: 113,
        rate: 131,
        amt: 151,
        igstPct: 167,
        igstAmt: 183,
        tot: RX,
      }
    : {
        no: ML,
        part: ML + 8,
        qty: 101,
        rate: 117,
        amt: 135,
        cgstPct: 149,
        cgstAmt: 163,
        sgstPct: 177,
        sgstAmt: 191,
        tot: RX,
      };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(isIGST ? 8 : 7);
  pdf.text("#", C.no + 1, y);
  pdf.text("Particulars", C.part, y);
  pdf.text("Qty", C.qty, y, { align: "right" });
  pdf.text("Rate", C.rate, y, { align: "right" });
  pdf.text("Amount", C.amt, y, { align: "right" });

  if (isIGST) {
    pdf.text("IGST %", C.igstPct, y, { align: "right" });
    pdf.text("IGST", C.igstAmt, y, { align: "right" });
  } else {
    pdf.text("CGST %", C.cgstPct, y, { align: "right" });
    pdf.text("CGST", C.cgstAmt, y, { align: "right" });
    pdf.text("SGST %", C.sgstPct, y, { align: "right" });
    pdf.text("SGST", C.sgstAmt, y, { align: "right" });
  }
  pdf.text("Total", C.tot, y, { align: "right" });
  y += 4;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(isIGST ? 8.5 : 7.5);
  let subtotal = 0;
  let tGST1 = 0;
  let tGST2 = 0;

  rows.forEach((row, idx) => {
    const qty = row.qty === "" || row.qty === undefined ? 1 : parseFloat(row.qty) || 1;
    const rate = parseFloat(row.rate) || 0;
    const amount = qty * rate;
    const gstAmt = (amount * gstPct) / 100;
    const gst1 = isIGST ? gstAmt : gstAmt / 2;
    const gst2 = isIGST ? 0 : gstAmt / 2;
    const total = amount + gstAmt;

    subtotal += amount;
    tGST1 += gst1;
    tGST2 += gst2;

    const particularsLines = splitText(pdf, row.particulars || "-", 76);
    const rowH = Math.max(6, particularsLines.length * 4.5);

    pdf.text(String(idx + 1), C.no + 1, y);
    pdf.text(particularsLines, C.part, y);
    pdf.text(f2(qty), C.qty, y, { align: "right" });
    pdf.text(f2(rate), C.rate, y, { align: "right" });
    pdf.text(f2(amount), C.amt, y, { align: "right" });

    if (isIGST) {
      pdf.text(gstPct + "%", C.igstPct, y, { align: "right" });
      pdf.text(f2(gst1), C.igstAmt, y, { align: "right" });
    } else {
      pdf.text(gstPct / 2 + "%", C.cgstPct, y, { align: "right" });
      pdf.text(f2(gst1), C.cgstAmt, y, { align: "right" });
      pdf.text(gstPct / 2 + "%", C.sgstPct, y, { align: "right" });
      pdf.text(f2(gst2), C.sgstAmt, y, { align: "right" });
    }
    pdf.text(f2(total), C.tot, y, { align: "right" });

    pdf.setDrawColor(0, 0, 0);
    pdf.line(ML, y + rowH - 3, RX, y + rowH - 3);
    y += rowH;
  });

  y += 2;
  hr(y);
  y += 6;

  const grandTotal = subtotal + tGST1 + tGST2;
  const LX = 132;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  const totalRows = [
    ["Subtotal", subtotal],
    isIGST ? ["IGST (" + gstPct + "%)", tGST1] : ["CGST (" + gstPct / 2 + "%)", tGST1],
    ...(!isIGST ? [["SGST (" + gstPct / 2 + "%)", tGST2]] : []),
  ];

  totalRows.forEach(([label, val]) => {
    pdf.text(label + ":", LX, y, { align: "right" });
    rt(Rs(val), y);
    y += 5;
  });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.text("Grand Total:", LX, y, { align: "right" });
  rt(Rs(grandTotal), y);
  y += 7;

  hr(y);
  y += 6;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.text("Amount in Words:", ML, y);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8.5);
  const wordLines = splitText(pdf, numberToWords(grandTotal), CW - 40);
  pdf.text(wordLines, ML + 40, y);
  y += wordLines.length * 4.5 + 5;

  hr(y);
  y += 6;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("GST Summary", ML, y);
  y += 4;

  pdf.text("Taxable Amt", ML + 2, y);
  pdf.text("Rate", ML + 40, y);
  if (isIGST) {
    pdf.text("IGST", ML + 60, y);
  } else {
    pdf.text("CGST", ML + 60, y);
    pdf.text("SGST", ML + 80, y);
  }
  pdf.text("Total Tax", ML + 103, y, { align: "right" });
  y += 5;

  pdf.setFont("helvetica", "normal");
  pdf.text(Rs(subtotal), ML + 2, y);
  pdf.text(gstPct + "%", ML + 40, y);
  if (isIGST) {
    pdf.text(Rs(tGST1), ML + 60, y);
  } else {
    pdf.text(Rs(tGST1), ML + 60, y);
    pdf.text(Rs(tGST2), ML + 80, y);
  }
  pdf.text(Rs(tGST1 + tGST2), ML + 103, y, { align: "right" });
  y += 10;

  const sigY = Math.max(y + 8, 255);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text("Received By:", ML, sigY);
  pdf.text("For " + COMPANY.name, RX, sigY, { align: "right" });
  pdf.line(ML, sigY + 12, ML + 55, sigY + 12);
  pdf.line(RX - 55, sigY + 12, RX, sigY + 12);
  pdf.setFontSize(7.5);
  pdf.text("Signature", ML, sigY + 16);
  pdf.text("Authorised Signatory", RX, sigY + 16, { align: "right" });

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(7);
  pdf.text("This is a computer-generated invoice.", ML, 290);
  rt("Subject to " + COMPANY.state + " jurisdiction.", 290);
}

export default function Invoice({ bill, onClose, onNewBill }) {
  const { billNumber, date, client, rows, gstType, gstRate } = bill;

  const gstPct = parseFloat(gstRate) || 0;
  const subtotal = rows.reduce((sum, row) => {
    const qty = row.qty === "" || row.qty === undefined ? 1 : parseFloat(row.qty) || 1;
    return sum + qty * (parseFloat(row.rate) || 0);
  }, 0);
  const gstAmount = (subtotal * gstPct) / 100;
  const cgst = gstType === "cgst_sgst" ? gstAmount / 2 : 0;
  const sgst = gstType === "cgst_sgst" ? gstAmount / 2 : 0;
  const igst = gstType === "igst" ? gstAmount : 0;
  const grandTotal = subtotal + gstAmount;

  const handleDownloadPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    drawInvoicePage(pdf, bill, "CLIENT COPY");
    pdf.addPage();
    drawInvoicePage(pdf, bill, "OFFICE COPY");
    pdf.save("Invoice-" + billNumber + ".pdf");
  };

  const InvoiceContent = ({ title }) => (
    <div className="bg-white p-6 text-sm text-black">
      <div className="mb-4 border-b border-black py-1 text-right text-xs font-bold tracking-widest">
        {title}
      </div>

      <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <div className="text-xl font-bold">{COMPANY.name}</div>
          <div className="mt-1 text-xs leading-5">
            {COMPANY.address}, {COMPANY.city}
            <br />
            GSTIN: {COMPANY.gstin} | State: {COMPANY.state} ({COMPANY.stateCode})
            <br />
            Ph: {COMPANY.phone} | {COMPANY.email}
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-base font-bold">TAX INVOICE</div>
          <div className="mt-1 text-xs leading-5">
            Invoice No: <strong>{billNumber}</strong>
            <br />
            Date: <strong>{date}</strong>
          </div>
        </div>
      </div>

      <hr className="mb-3 border-black" />

      <div className="mb-4 border border-black p-3 text-xs leading-5">
        <div className="mb-1 text-xs font-bold uppercase">Bill To</div>
        <div className="text-sm font-bold">{client?.company || client?.name || "Walk-in Customer"}</div>
        {client?.name && client?.company && client.name !== client.company && <div>{client.name}</div>}
        {client?.gstin && <div>GSTIN: <strong>{client.gstin}</strong></div>}
        {client?.address && <div>{[client.address, client.city, client.state].filter(Boolean).join(", ")}</div>}
        {client?.phone && <div>Ph: {client.phone}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-black text-xs" style={{ minWidth: "560px" }}>
          <thead>
            <tr>
              <th className="w-6 border border-black px-2 py-1.5 text-left">#</th>
              <th className="border border-black px-2 py-1.5 text-left">Particulars</th>
              <th className="w-14 border border-black px-2 py-1.5 text-right">Qty</th>
              <th className="w-18 border border-black px-2 py-1.5 text-right">Rate</th>
              <th className="w-20 border border-black px-2 py-1.5 text-right">Amount</th>
              {gstType === "igst" && (
                <>
                  <th className="w-14 border border-black px-2 py-1.5 text-right">IGST%</th>
                  <th className="w-18 border border-black px-2 py-1.5 text-right">IGST</th>
                </>
              )}
              {gstType === "cgst_sgst" && (
                <>
                  <th className="w-14 border border-black px-2 py-1.5 text-right">CGST%</th>
                  <th className="w-18 border border-black px-2 py-1.5 text-right">CGST</th>
                  <th className="w-14 border border-black px-2 py-1.5 text-right">SGST%</th>
                  <th className="w-18 border border-black px-2 py-1.5 text-right">SGST</th>
                </>
              )}
              <th className="w-20 border border-black px-2 py-1.5 text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const qty = row.qty === "" || row.qty === undefined ? 1 : parseFloat(row.qty) || 1;
              const rate = parseFloat(row.rate) || 0;
              const amount = qty * rate;
              const gstA = (amount * gstPct) / 100;
              const rCGST = gstType === "cgst_sgst" ? gstA / 2 : 0;
              const rSGST = gstType === "cgst_sgst" ? gstA / 2 : 0;
              const rIGST = gstType === "igst" ? gstA : 0;

              return (
                <tr key={i}>
                  <td className="border border-black px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-black px-2 py-1.5">{row.particulars || "-"}</td>
                  <td className="border border-black px-2 py-1.5 text-right">{qty}</td>
                  <td className="border border-black px-2 py-1.5 text-right">{rate.toFixed(2)}</td>
                  <td className="border border-black px-2 py-1.5 text-right">{amount.toFixed(2)}</td>
                  {gstType === "igst" && (
                    <>
                      <td className="border border-black px-2 py-1.5 text-right">{gstPct}%</td>
                      <td className="border border-black px-2 py-1.5 text-right">{rIGST.toFixed(2)}</td>
                    </>
                  )}
                  {gstType === "cgst_sgst" && (
                    <>
                      <td className="border border-black px-2 py-1.5 text-right">{gstPct / 2}%</td>
                      <td className="border border-black px-2 py-1.5 text-right">{rCGST.toFixed(2)}</td>
                      <td className="border border-black px-2 py-1.5 text-right">{gstPct / 2}%</td>
                      <td className="border border-black px-2 py-1.5 text-right">{rSGST.toFixed(2)}</td>
                    </>
                  )}
                  <td className="border border-black px-2 py-1.5 text-right font-semibold">
                    {(amount + gstA).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-52 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rs{subtotal.toFixed(2)}</span>
          </div>
          {gstType === "cgst_sgst" && (
            <>
              <div className="flex justify-between">
                <span>CGST ({gstPct / 2}%):</span>
                <span>Rs{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST ({gstPct / 2}%):</span>
                <span>Rs{sgst.toFixed(2)}</span>
              </div>
            </>
          )}
          {gstType === "igst" && (
            <div className="flex justify-between">
              <span>IGST ({gstPct}%):</span>
              <span>Rs{igst.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-black pt-2 text-sm font-bold">
            <span>Grand Total:</span>
            <span>Rs{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 border border-black px-3 py-2 text-xs">
        <span className="font-bold">Amount in Words: </span>
        <span className="italic">{numberToWords(grandTotal)}</span>
      </div>

      <div className="mt-8 flex justify-between text-xs">
        <div>
          <div>Received By:</div>
          <div className="mt-8 w-32 border-t border-black pt-1">Signature</div>
        </div>
        <div className="text-right">
          <div>For {COMPANY.name}</div>
          <div className="mt-8 ml-auto w-32 border-t border-black pt-1">Authorised Signatory</div>
        </div>
      </div>

      <div className="mt-4 text-xs italic">This is a computer-generated invoice.</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75">
      <div className="min-h-screen px-3 py-6">
        <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadPDF}
              className="bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Download PDF
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Print
            </button>
            {onNewBill && (
              <button
                onClick={onNewBill}
                className="border-2 border-white px-5 py-2.5 text-sm font-semibold text-white hover:bg-white hover:text-gray-900"
              >
                + New Bill
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-2 text-2xl text-gray-300 hover:text-white">
            x
          </button>
        </div>

        <div id="print-area" className="mx-auto max-w-3xl space-y-3">
          <div className="shadow-2xl">
            <InvoiceContent title="CLIENT COPY" />
          </div>
          <div className="no-print py-1 text-center font-mono text-xs text-gray-500">cut here</div>
          <div className="shadow-2xl">
            <InvoiceContent title="OFFICE COPY" />
          </div>
        </div>
      </div>
    </div>
  );
}
