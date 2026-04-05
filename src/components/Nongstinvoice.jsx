/**
 * NonGSTInvoice.jsx
 * -----------------
 * Generates a simple non-GST bill — no tax columns, no CGST/SGST/IGST.
 * Layout matches the reference image: black & white, clean table format.
 *
 * Columns: # | Particulars | Qty | Rate | Amount
 * Totals:  Subtotal → Grand Total (no tax lines)
 */

import React from "react";
import jsPDF from "jspdf";
import { numberToWords } from "../utils/amountToWords";
import { COMPANY } from "../data/items";

const f2 = (n) => (parseFloat(n) || 0).toFixed(2);
const fN = (n) => (parseFloat(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

function splitText(pdf, text, maxW) {
  return pdf.splitTextToSize(String(text || ""), maxW);
}

// ─── PDF DRAW ────────────────────────────────────────────────────────────────
function drawNonGSTPage(pdf, bill, copyLabel) {
  const { billNumber, date, client, rows } = bill;
  const PW = 210, ML = 10, MR = 10, CW = PW - ML - MR, RX = PW - MR;
  const rt = (txt, y) => pdf.text(String(txt), RX, y, { align: "right" });
  const hr = (y) => { pdf.setDrawColor(0,0,0); pdf.line(ML, y, RX, y); };

  let y = 10;

  // copy label — top right, small text, no background
  pdf.setFont("helvetica","bold"); pdf.setFontSize(8);
  rt(copyLabel, y + 3);
  y += 8;

  // company block (left) + TAX INVOICE (right)
  pdf.setFont("helvetica","bold"); pdf.setFontSize(14);
  pdf.text(COMPANY.name, ML, y);
  pdf.setFont("helvetica","bold"); pdf.setFontSize(12);
  rt("TAX INVOICE", y);
  y += 5;

  pdf.setFont("helvetica","normal"); pdf.setFontSize(8.5);
  [
    COMPANY.address + ", " + COMPANY.city,
    "GSTIN: " + COMPANY.gstin + "  |  State: " + COMPANY.state + " (" + COMPANY.stateCode + ")",
    "Ph: " + COMPANY.phone + "  |  " + COMPANY.email,
  ].forEach((l, i) => {
    pdf.text(l, ML, y);
    if (i === 0) { rt("Invoice No: " + billNumber, y); }
    if (i === 1) { rt("Date: " + date, y); }
    y += 4;
  });

  y += 2; hr(y); y += 5;

  // bill to
  pdf.setFont("helvetica","bold"); pdf.setFontSize(8.5);
  pdf.text("BILL TO", ML, y); y += 4;
  pdf.setFont("helvetica","bold"); pdf.setFontSize(10);
  pdf.text(client?.company || client?.name || "Walk-in Customer", ML, y);
  pdf.setFont("helvetica","normal"); pdf.setFontSize(8.5); y += 4.5;
  if (client?.name && client?.company && client.name !== client.company) { pdf.text(client.name, ML, y); y += 4; }
  if (client?.address) {
    const al = splitText(pdf, [client.address, client.city, client.state].filter(Boolean).join(", "), CW);
    pdf.text(al, ML, y); y += al.length * 4;
  }
  if (client?.phone) { pdf.text("Ph: " + client.phone, ML, y); y += 4; }

  y += 3; hr(y); y += 5;

  // table header
  const C = { no: ML, part: ML+8, qty: ML+100, rate: ML+128, amt: RX };

  pdf.setFillColor(0,0,0);
  pdf.rect(ML, y-5, CW, 9, "F");
  pdf.setFont("helvetica","bold"); pdf.setFontSize(8.5);
  pdf.setTextColor(255,255,255);
  pdf.text("#",           C.no+2,   y);
  pdf.text("Particulars", C.part,   y);
  pdf.text("Qty",         C.qty,    y, { align:"right" });
  pdf.text("Rate",        C.rate,   y, { align:"right" });
  pdf.text("Amount",      C.amt,    y, { align:"right" });
  pdf.setTextColor(0,0,0);
  y += 8;

  // rows
  pdf.setFont("helvetica","normal"); pdf.setFontSize(9);
  let subtotal = 0;

  rows.forEach((row, idx) => {
    const qty    = row.qty===""||row.qty===undefined ? 1 : parseFloat(row.qty)||1;
    const rate   = parseFloat(row.rate)||0;
    const amount = qty * rate;
    subtotal    += amount;

    const pl   = splitText(pdf, row.particulars || "-", 88);
    const rowH = Math.max(7, pl.length * 4.5);

    pdf.text(String(idx+1), C.no+2,  y);
    pdf.text(pl,            C.part,  y);
    pdf.text(f2(qty),       C.qty,   y, { align:"right" });
    pdf.text(f2(rate),      C.rate,  y, { align:"right" });
    pdf.text(fN(amount),    C.amt,   y, { align:"right" });

    pdf.setDrawColor(180,180,180);
    pdf.line(ML, y+rowH-3, RX, y+rowH-3);
    pdf.setDrawColor(0,0,0);
    y += rowH;
  });

  y += 2; hr(y); y += 6;

  // totals — just subtotal = grand total (no GST)
  const LX = 130;
  pdf.setFont("helvetica","normal"); pdf.setFontSize(9);
  pdf.text("Subtotal:", LX, y, { align:"right" });
  rt("Rs. " + fN(subtotal), y);
  y += 6;

  pdf.setFont("helvetica","bold"); pdf.setFontSize(10.5);
  pdf.text("Grand Total:", LX, y, { align:"right" });
  rt("Rs. " + fN(subtotal), y);
  y += 7;

  hr(y); y += 6;

  // amount in words
  pdf.setFont("helvetica","bold"); pdf.setFontSize(8.5);
  pdf.text("Amount in Words:", ML, y);
  pdf.setFont("helvetica","italic"); pdf.setFontSize(8.5);
  const wl = splitText(pdf, numberToWords(subtotal), CW - 42);
  pdf.text(wl, ML+42, y);
  y += wl.length * 4.5 + 8;

  // signatures
  const sigY = Math.max(y+8, 255);
  pdf.setFont("helvetica","normal"); pdf.setFontSize(8.5);
  pdf.text("Received By:", ML, sigY);
  rt("For " + COMPANY.name, sigY);
  pdf.line(ML,     sigY+12, ML+55, sigY+12);
  pdf.line(RX-55,  sigY+12, RX,    sigY+12);
  pdf.setFontSize(7.5);
  pdf.text("Signature",           ML,  sigY+16);
  rt("Authorised Signatory",       sigY+16);

  // footer
  pdf.setFont("helvetica","italic"); pdf.setFontSize(7);
  pdf.setTextColor(120,120,120);
  pdf.text("This is a computer-generated invoice.", ML, 290);
  rt("Subject to " + COMPANY.state + " jurisdiction.", 290);
  pdf.setTextColor(0,0,0);
}

// ─── SCREEN COMPONENT ────────────────────────────────────────────────────────
export default function NonGSTInvoice({ bill, onClose, onNewBill }) {
  const { billNumber, date, client, rows } = bill;

  const subtotal = rows.reduce((s, r) => {
    const qty = r.qty===""||r.qty===undefined ? 1 : parseFloat(r.qty)||1;
    return s + qty * (parseFloat(r.rate)||0);
  }, 0);

  const handleDownloadPDF = () => {
    const pdf = new jsPDF("p","mm","a4");
    drawNonGSTPage(pdf, bill, "CLIENT COPY");
    pdf.addPage();
    drawNonGSTPage(pdf, bill, "OFFICE COPY");
    pdf.save("Invoice-" + billNumber + ".pdf");
  };

  const S = {
    wrap: { width:"210mm", minHeight:"297mm", background:"#fff", color:"#000", fontFamily:"Arial,sans-serif", fontSize:"10px", padding:"10mm", boxSizing:"border-box", border:"1px solid #000" },
  };

  const InvoiceContent = ({ title }) => (
    <div style={S.wrap}>

      {/* copy label */}
      <div style={{ textAlign:"right", fontSize:"9px", fontWeight:"bold", marginBottom:"4px" }}>{title}</div>

      {/* header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"6px" }}>
        <div>
          <div style={{ fontWeight:"bold", fontSize:"16px" }}>{COMPANY.name}</div>
          <div style={{ fontSize:"9px", marginTop:"3px", lineHeight:"1.7" }}>
            {COMPANY.address}, {COMPANY.city}<br/>
            GSTIN: {COMPANY.gstin} | State: {COMPANY.state} ({COMPANY.stateCode})<br/>
            Ph: {COMPANY.phone} | {COMPANY.email}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontWeight:"bold", fontSize:"14px" }}>TAX INVOICE</div>
          <div style={{ fontSize:"9px", marginTop:"4px", lineHeight:"1.8" }}>
            Invoice No: <strong>{billNumber}</strong><br/>
            Date: <strong>{date}</strong>
          </div>
        </div>
      </div>

      <hr style={{ border:"none", borderTop:"1px solid #000", margin:"6px 0" }}/>

      {/* bill to */}
      <div style={{ border:"1px solid #000", padding:"6px 8px", marginBottom:"8px", fontSize:"10px", lineHeight:"1.7" }}>
        <div style={{ fontWeight:"bold", fontSize:"9px", textTransform:"uppercase", color:"#555", marginBottom:"2px" }}>Bill To</div>
        <div style={{ fontWeight:"bold", fontSize:"12px" }}>{client?.company || client?.name || "Walk-in Customer"}</div>
        {client?.name && client?.company && client.name!==client.company && <div>{client.name}</div>}
        {client?.address && <div>{[client.address, client.city, client.state].filter(Boolean).join(", ")}</div>}
        {client?.phone   && <div>Ph: {client.phone}</div>}
      </div>

      {/* items table — no GST columns */}
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"10px", marginBottom:"8px" }}>
        <thead>
          <tr style={{ background:"#000", color:"#fff" }}>
            <th style={{ border:"1px solid #000", padding:"5px 6px", textAlign:"left",  width:"24px" }}>#</th>
            <th style={{ border:"1px solid #000", padding:"5px 6px", textAlign:"left"              }}>Particulars</th>
            <th style={{ border:"1px solid #000", padding:"5px 6px", textAlign:"right", width:"48px" }}>Qty</th>
            <th style={{ border:"1px solid #000", padding:"5px 6px", textAlign:"right", width:"72px" }}>Rate</th>
            <th style={{ border:"1px solid #000", padding:"5px 6px", textAlign:"right", width:"80px" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const qty    = row.qty===""||row.qty===undefined ? 1 : parseFloat(row.qty)||1;
            const rate   = parseFloat(row.rate)||0;
            const amount = qty * rate;
            return (
              <tr key={i} style={{ background:"#fff" }}>
                <td style={{ border:"1px solid #ccc", padding:"4px 6px", textAlign:"center" }}>{i+1}</td>
                <td style={{ border:"1px solid #ccc", padding:"4px 6px" }}>{row.particulars||"—"}</td>
                <td style={{ border:"1px solid #ccc", padding:"4px 6px", textAlign:"right" }}>{qty}</td>
                <td style={{ border:"1px solid #ccc", padding:"4px 6px", textAlign:"right" }}>{f2(rate)}</td>
                <td style={{ border:"1px solid #ccc", padding:"4px 6px", textAlign:"right", fontWeight:"bold" }}>{fN(amount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* totals — no GST rows */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"8px" }}>
        <table style={{ fontSize:"10px", borderCollapse:"collapse", minWidth:"180px" }}>
          <tbody>
            <tr>
              <td style={{ padding:"3px 12px 3px 0", color:"#444" }}>Subtotal:</td>
              <td style={{ padding:"3px 0", textAlign:"right" }}>Rs. {fN(subtotal)}</td>
            </tr>
            <tr style={{ borderTop:"1px solid #000" }}>
              <td style={{ padding:"5px 12px 3px 0", fontWeight:"bold", fontSize:"12px" }}>Grand Total:</td>
              <td style={{ padding:"5px 0 3px", textAlign:"right", fontWeight:"bold", fontSize:"12px" }}>Rs. {fN(subtotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* amount in words */}
      <div style={{ border:"1px solid #000", padding:"5px 8px", fontSize:"10px", marginBottom:"16px" }}>
        <strong>Amount in Words: </strong>
        <span style={{ fontStyle:"italic" }}>{numberToWords(subtotal)}</span>
      </div>

      {/* signatures */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"24px", fontSize:"10px" }}>
        <div>
          <div>Received By:</div>
          <div style={{ borderTop:"1px solid #000", marginTop:"32px", paddingTop:"3px", width:"120px", color:"#555" }}>Signature</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div>For {COMPANY.name}</div>
          <div style={{ borderTop:"1px solid #000", marginTop:"32px", paddingTop:"3px", width:"140px", marginLeft:"auto", color:"#555" }}>Authorised Signatory</div>
        </div>
      </div>

      <div style={{ marginTop:"12px", fontSize:"9px", color:"#777", fontStyle:"italic" }}>
        This is a computer-generated invoice.
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
      <div className="py-6 px-4">

        {/* action buttons */}
        <div style={{ maxWidth:"210mm", margin:"0 auto 12px" }} className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="bg-black text-white px-5 py-2 text-sm font-semibold hover:bg-gray-800">
              ⬇ Download PDF
            </button>
            <button onClick={() => window.print()} className="border border-white text-white px-5 py-2 text-sm font-semibold hover:bg-white hover:text-black">
              🖨 Print
            </button>
            {onNewBill && (
              <button onClick={onNewBill} className="border border-white text-white px-5 py-2 text-sm font-semibold hover:bg-white hover:text-black">
                + New Bill
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white text-2xl px-2">✕</button>
        </div>

        {/* two copies */}
        <div id="print-area" style={{ maxWidth:"210mm", margin:"0 auto" }} className="space-y-4">
          <InvoiceContent title="CLIENT COPY" />
          <div className="no-print text-center text-gray-400 text-xs font-mono py-1">✂ ── cut here ──</div>
          <InvoiceContent title="OFFICE COPY" />
        </div>
      </div>
    </div>
  );
}