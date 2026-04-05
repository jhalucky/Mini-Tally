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

  // copy label — top right, no background
  pdf.setFont("helvetica","bold"); pdf.setFontSize(8);
  rt(copyLabel, y + 3);
  y += 8;

  // company name + TAX INVOICE
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
    if (i === 0) rt("Invoice No: " + billNumber, y);
    if (i === 1) rt("Date: " + date, y);
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
  pdf.text("#",           C.no+2,  y);
  pdf.text("Particulars", C.part,  y);
  pdf.text("Qty",         C.qty,   y, { align:"right" });
  pdf.text("Rate",        C.rate,  y, { align:"right" });
  pdf.text("Amount",      C.amt,   y, { align:"right" });
  pdf.setTextColor(0,0,0);
  y += 8;

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

  pdf.setFont("helvetica","bold"); pdf.setFontSize(8.5);
  pdf.text("Amount in Words:", ML, y);
  pdf.setFont("helvetica","italic"); pdf.setFontSize(8.5);
  const wl = splitText(pdf, numberToWords(subtotal), CW - 42);
  pdf.text(wl, ML+42, y);
  y += wl.length * 4.5 + 8;

  const sigY = Math.max(y+8, 255);
  pdf.setFont("helvetica","normal"); pdf.setFontSize(8.5);
  pdf.text("Received By:", ML, sigY);
  rt("For " + COMPANY.name, sigY);
  pdf.line(ML,    sigY+12, ML+55, sigY+12);
  pdf.line(RX-55, sigY+12, RX,    sigY+12);
  pdf.setFontSize(7.5);
  pdf.text("Signature",          ML,  sigY+16);
  rt("Authorised Signatory",     sigY+16);

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

  // A4 = 210mm. We render at fixed 794px (96dpi equiv) and scale down on small screens.
  const InvoiceContent = ({ title }) => (
    <div style={{
      width: "794px",
      minHeight: "1123px",
      background: "#fff",
      color: "#000",
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      padding: "38px 40px",
      boxSizing: "border-box",
      border: "1px solid #000",
    }}>

      {/* copy label */}
      <div style={{ textAlign:"right", fontSize:"11px", fontWeight:"bold", marginBottom:"6px" }}>{title}</div>

      {/* header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:"bold", fontSize:"20px" }}>{COMPANY.name}</div>
          <div style={{ fontSize:"11px", marginTop:"4px", lineHeight:"1.8" }}>
            {COMPANY.address}, {COMPANY.city}<br/>
            GSTIN: {COMPANY.gstin} | State: {COMPANY.state} ({COMPANY.stateCode})<br/>
            Ph: {COMPANY.phone} | {COMPANY.email}
          </div>
        </div>
        <div style={{ textAlign:"right", marginLeft:"20px", flexShrink:0 }}>
          <div style={{ fontWeight:"bold", fontSize:"16px" }}>TAX INVOICE</div>
          <div style={{ fontSize:"11px", marginTop:"5px", lineHeight:"1.8" }}>
            Invoice No: <strong>{billNumber}</strong><br/>
            Date: <strong>{date}</strong>
          </div>
        </div>
      </div>

      <hr style={{ border:"none", borderTop:"1px solid #000", margin:"8px 0" }}/>

      {/* bill to */}
      <div style={{ border:"1px solid #000", padding:"8px 10px", marginBottom:"10px", fontSize:"12px", lineHeight:"1.8" }}>
        <div style={{ fontWeight:"bold", fontSize:"11px", textTransform:"uppercase", color:"#555", marginBottom:"3px" }}>Bill To</div>
        <div style={{ fontWeight:"bold", fontSize:"15px" }}>{client?.company || client?.name || "Walk-in Customer"}</div>
        {client?.name && client?.company && client.name!==client.company && <div>{client.name}</div>}
        {client?.gstin   && <div>GSTIN: <strong>{client.gstin}</strong></div>}
        {client?.address && <div>{[client.address, client.city, client.state].filter(Boolean).join(", ")}</div>}
        {client?.phone   && <div>Ph: {client.phone}</div>}
      </div>

      {/* items table */}
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px", marginBottom:"10px", tableLayout:"fixed" }}>
        <colgroup>
          <col style={{ width:"32px" }}/>
          <col/>
          <col style={{ width:"64px" }}/>
          <col style={{ width:"90px" }}/>
          <col style={{ width:"100px" }}/>
        </colgroup>
        <thead>
          <tr style={{ background:"#000", color:"#fff" }}>
            <th style={{ border:"1px solid #000", padding:"6px 6px", textAlign:"center" }}>#</th>
            <th style={{ border:"1px solid #000", padding:"6px 8px", textAlign:"left"   }}>Particulars</th>
            <th style={{ border:"1px solid #000", padding:"6px 6px", textAlign:"right"  }}>Qty</th>
            <th style={{ border:"1px solid #000", padding:"6px 6px", textAlign:"right"  }}>Rate</th>
            <th style={{ border:"1px solid #000", padding:"6px 8px", textAlign:"right"  }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const qty    = row.qty===""||row.qty===undefined ? 1 : parseFloat(row.qty)||1;
            const rate   = parseFloat(row.rate)||0;
            const amount = qty * rate;
            return (
              <tr key={i}>
                <td style={{ border:"1px solid #ccc", padding:"5px 6px", textAlign:"center" }}>{i+1}</td>
                <td style={{ border:"1px solid #ccc", padding:"5px 8px", wordBreak:"break-word" }}>{row.particulars||"—"}</td>
                <td style={{ border:"1px solid #ccc", padding:"5px 6px", textAlign:"right" }}>{qty}</td>
                <td style={{ border:"1px solid #ccc", padding:"5px 6px", textAlign:"right" }}>{f2(rate)}</td>
                <td style={{ border:"1px solid #ccc", padding:"5px 8px", textAlign:"right", fontWeight:"bold" }}>{fN(amount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* totals */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"10px" }}>
        <table style={{ fontSize:"12px", borderCollapse:"collapse", minWidth:"220px" }}>
          <tbody>
            <tr>
              <td style={{ padding:"4px 16px 4px 0", color:"#444" }}>Subtotal:</td>
              <td style={{ padding:"4px 0", textAlign:"right", minWidth:"100px" }}>Rs. {fN(subtotal)}</td>
            </tr>
            <tr style={{ borderTop:"1px solid #000" }}>
              <td style={{ padding:"6px 16px 4px 0", fontWeight:"bold", fontSize:"14px" }}>Grand Total:</td>
              <td style={{ padding:"6px 0 4px", textAlign:"right", fontWeight:"bold", fontSize:"14px" }}>Rs. {fN(subtotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* amount in words */}
      <div style={{ border:"1px solid #000", padding:"7px 10px", fontSize:"12px", marginBottom:"20px" }}>
        <strong>Amount in Words: </strong>
        <span style={{ fontStyle:"italic" }}>{numberToWords(subtotal)}</span>
      </div>

      {/* signatures */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"40px", fontSize:"12px" }}>
        <div>
          <div>Received By:</div>
          <div style={{ borderTop:"1px solid #000", marginTop:"40px", paddingTop:"4px", width:"140px", color:"#555" }}>Signature</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div>For {COMPANY.name}</div>
          <div style={{ borderTop:"1px solid #000", marginTop:"40px", paddingTop:"4px", width:"160px", marginLeft:"auto", color:"#555" }}>Authorised Signatory</div>
        </div>
      </div>

      <div style={{ marginTop:"16px", fontSize:"11px", color:"#777", fontStyle:"italic" }}>
        This is a computer-generated invoice.
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
      <div className="py-6 px-4">

        {/* action buttons */}
        <div className="max-w-3xl mx-auto mb-4 flex flex-wrap gap-2 items-center justify-between">
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

        {/* invoice copies — horizontally scrollable on small screens, scaled down */}
        <div id="print-area" className="space-y-4">
          <div style={{ overflowX:"auto" }}>
            <div style={{ transform:"scale(1)", transformOrigin:"top left", width:"794px", margin:"0 auto" }}>
              <InvoiceContent title="CLIENT COPY" />
            </div>
          </div>

          <div className="no-print text-center text-gray-400 text-xs font-mono py-1">✂ ── cut here ──</div>

          <div style={{ overflowX:"auto" }}>
            <div style={{ transform:"scale(1)", transformOrigin:"top left", width:"794px", margin:"0 auto" }}>
              <InvoiceContent title="OFFICE COPY" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}